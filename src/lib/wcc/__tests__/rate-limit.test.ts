import { describe, it, expect, beforeEach, vi } from "vitest";

// B1 — shared sliding-window rate limiter (module under construction).
import { SlidingWindowRateLimiter } from "@/lib/wcc/rate-limit";

describe("SlidingWindowRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("allows the first 5 requests within the window", () => {
    const rl = new SlidingWindowRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 });
    for (let i = 0; i < 5; i++) {
      expect(rl.check("1.2.3.4")).toBe(false);
    }
  });

  it("blocks the 6th request within the window", () => {
    const rl = new SlidingWindowRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 });
    for (let i = 0; i < 5; i++) rl.check("1.2.3.4");
    expect(rl.check("1.2.3.4")).toBe(true);
  });

  it("allows again after the window expires", () => {
    const rl = new SlidingWindowRateLimiter({ windowMs: 1_000, max: 2 });
    rl.check("a");
    rl.check("a");
    expect(rl.check("a")).toBe(true);
    vi.advanceTimersByTime(1_001);
    expect(rl.check("a")).toBe(false);
  });

  it("tracks keys independently", () => {
    const rl = new SlidingWindowRateLimiter({ windowMs: 10 * 60 * 1000, max: 1 });
    expect(rl.check("a")).toBe(false);
    expect(rl.check("b")).toBe(false);
    expect(rl.check("a")).toBe(true);
  });

  it("prunes stale entries so the map does not grow forever", () => {
    const rl = new SlidingWindowRateLimiter({ windowMs: 1_000, max: 1 });
    rl.check("old-ip");
    vi.advanceTimersByTime(2_000);
    rl.check("new-ip");
    // internal map should have dropped the expired key
    expect(rl.size()).toBe(1);
  });

  it("drops a key entirely when its window empties", () => {
    const rl = new SlidingWindowRateLimiter({ windowMs: 1_000, max: 5 });
    rl.check("x");
    vi.advanceTimersByTime(2_000);
    rl.check("y");
    expect(rl.size()).toBe(1);
  });
});
