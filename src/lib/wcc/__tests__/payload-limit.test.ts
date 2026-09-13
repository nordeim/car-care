import { describe, expect, it } from "vitest";
import { isBodyTooLarge, MAX_BODY_BYTES } from "../payload-limit";

const req = (headers: Record<string, string>) =>
  new Request("https://example.com/api/bookings", { method: "POST", headers });

describe("isBodyTooLarge", () => {
  it("flags bodies above the 32KB cap via content-length", () => {
    expect(MAX_BODY_BYTES).toBe(32 * 1024);
    expect(isBodyTooLarge(req({ "content-length": String(64 * 1024) }))).toBe(true);
  });

  it("allows bodies at or below the cap", () => {
    expect(isBodyTooLarge(req({ "content-length": String(MAX_BODY_BYTES) }))).toBe(false);
    expect(isBodyTooLarge(req({ "content-length": "1024" }))).toBe(false);
  });

  it("allows requests without content-length (chunked) — zod bounds fields", () => {
    expect(isBodyTooLarge(req({}))).toBe(false);
  });

  it("treats a malformed content-length as absent", () => {
    expect(isBodyTooLarge(req({ "content-length": "huge" }))).toBe(false);
  });
});
