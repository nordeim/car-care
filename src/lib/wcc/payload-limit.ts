/**
 * Cheap request-body size guard for the POST route handlers.
 *
 * Next.js route handlers impose no body-size limit by default; without this,
 * a multi-megabyte payload costs memory + JSON.parse before zod rejects it.
 *
 * The check is the zero-cost `content-length` header (set by browsers and
 * by every HTTP client for JSON bodies). Chunked/absent-length requests are
 * allowed through — zod's per-field max() still bounds the parsed result.
 * Contract: `src/lib/wcc/__tests__/payload-limit.test.ts`.
 */
export const MAX_BODY_BYTES = 32 * 1024;

export function isBodyTooLarge(request: Request): boolean {
  const raw = request.headers.get("content-length");
  if (!raw) return false;
  const len = Number(raw);
  return Number.isFinite(len) && len > MAX_BODY_BYTES;
}
