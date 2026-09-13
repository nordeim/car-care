/**
 * Sliding-window rate limiter shared by the API routes.
 *
 * In-memory and per-process (fine for a single-node deployment behind
 * one proxy). Prunes expired keys on every check so the underlying Map
 * cannot grow unboundedly with one-off visitor IPs.
 */
export interface RateLimiterOptions {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Max allowed hits per key inside the window. */
  max: number;
}

export class SlidingWindowRateLimiter {
  private readonly windowMs: number;
  private readonly max: number;
  private readonly hits = new Map<string, number[]>();

  constructor({ windowMs, max }: RateLimiterOptions) {
    if (windowMs <= 0 || max <= 0) throw new Error("windowMs and max must be positive");
    this.windowMs = windowMs;
    this.max = max;
  }

  /**
   * Record a hit for `key` and report whether the key is now rate-limited.
   * Returns `true` when the caller should be blocked. Also sweeps expired
   * keys across the whole map so one-off visitor IPs cannot accumulate.
   */
  check(key: string, now: number = Date.now()): boolean {
    this.prune(now);
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return true;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return false;
  }

  /** Remove expired timestamps; drop keys whose windows are empty. */
  private prune(now: number): void {
    for (const [key, stamps] of this.hits) {
      const recent = stamps.filter((t) => now - t < this.windowMs);
      if (recent.length === 0) {
        this.hits.delete(key);
      } else if (recent.length !== stamps.length) {
        this.hits.set(key, recent);
      }
    }
  }

  /** Number of tracked keys (test/diagnostic use). */
  size(): number {
    return this.hits.size;
  }
}

/** Shared instance: 5 submissions per IP per 10 minutes. */
export const bookingRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
});

export const questionRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
});

/**
 * Extract the best-effort visitor IP for rate limiting.
 *
 * Proxy chain in production is Cloudflare → Caddy → Next:
 *  - `cf-connecting-ip` is set/stripped by Cloudflare to the real visitor IP
 *    (most reliable when traffic flows through CF).
 *  - `x-forwarded-for` first hop is the classic direct-deployment case
 *    (Caddy overwrites it with its remote host on its own hop).
 *  - No headers (direct node-to-node/internal calls) → shared "local" key.
 *
 * Residual risk (accepted, ADR-005): if the origin is directly reachable,
 * both headers are client-spoofable and the in-memory limiter is best-effort
 * anyway — this keys the bucket, not a security boundary.
 */
export function clientIpFrom(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const xff = request.headers.get("x-forwarded-for")?.trim();
  if (xff) return xff.split(",")[0].trim();
  return "local";
}
