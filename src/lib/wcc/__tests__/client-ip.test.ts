import { describe, expect, it } from "vitest";
import { clientIpFrom } from "../rate-limit";

/**
 * Contract: behind the real proxy chain (Cloudflare → Caddy → Next), the
 * rate limiter must key on the visitor IP — not a spoofable first hop and
 * not the proxy edge IP.
 *
 * Worked examples (independent source of truth — how each proxy behaves):
 *   - Cloudflare sets/strips `cf-connecting-ip` to the real visitor IP.
 *   - Caddy replaces `x-forwarded-for` with its remote host (the CF edge IP
 *     behind Cloudflare, or the real client IP on direct deployments).
 *   - A client may send ANY `x-forwarded-for` it likes on direct paths.
 */
const req = (headers: Record<string, string>) =>
  new Request("https://example.com/api/bookings", { method: "POST", headers });

describe("clientIpFrom", () => {
  it("prefers cf-connecting-ip when Cloudflare provides it", () => {
    expect(
      clientIpFrom(
        req({
          "cf-connecting-ip": "203.0.113.7",
          "x-forwarded-for": "spoofed.example, 203.0.113.7, 198.51.100.1",
        }),
      ),
    ).toBe("203.0.113.7");
  });

  it("falls back to the first x-forwarded-for hop on non-CF deployments", () => {
    expect(
      clientIpFrom(req({ "x-forwarded-for": "198.51.100.23, 10.0.0.1" })),
    ).toBe("198.51.100.23");
  });

  it("trims whitespace around the first x-forwarded-for hop", () => {
    expect(clientIpFrom(req({ "x-forwarded-for": " 198.51.100.9 , 10.0.0.2" }))).toBe(
      "198.51.100.9",
    );
  });

  it("returns 'local' when neither header exists", () => {
    expect(clientIpFrom(req({}))).toBe("local");
  });

  it("treats an empty cf-connecting-ip as absent (falls through to xff)", () => {
    expect(
      clientIpFrom(req({ "cf-connecting-ip": " ", "x-forwarded-for": "198.51.100.4" })),
    ).toBe("198.51.100.4");
  });
});
