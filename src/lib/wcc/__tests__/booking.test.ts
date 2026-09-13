import { describe, it, expect } from "vitest";

// B3 — regression locks for existing booking logic (should pass as-is).
import { buildDayOptions, findService, quoteFor, usd } from "@/lib/wcc/booking";
import { BOOKABLE_SERVICES } from "@/data/wcc/content";

describe("findService", () => {
  it("finds a known service", () => {
    expect(findService("premium-full")?.name).toBe("Premium Full Detail");
  });
  it("returns undefined for unknown keys", () => {
    expect(findService("does-not-exist")).toBeUndefined();
  });
});

describe("quoteFor", () => {
  it("returns the sedan base price", () => {
    expect(quoteFor("essential-full", "sedan", false)).toBe(240);
  });
  it("returns the suv base price", () => {
    expect(quoteFor("essential-full", "suv", false)).toBe(295);
  });
  it("adds the ceramic add-on when allowed", () => {
    expect(quoteFor("premium-full", "sedan", true)).toBe(560);
  });
  it("ignores the add-on for services that do not allow it (ceramic tiers)", () => {
    expect(quoteFor("ceramic-3yr", "sedan", true)).toBe(795);
  });
  it("returns null for unknown service keys", () => {
    expect(quoteFor("nope", "sedan", false)).toBeNull();
  });
});

describe("buildDayOptions", () => {
  it("builds 14 consecutive days starting today", () => {
    const days = buildDayOptions(new Date(2026, 8, 14), 14); // Sep 14 2026 (Monday)
    expect(days).toHaveLength(14);
    expect(days[0].iso).toBe("2026-09-14");
    expect(days[13].iso).toBe("2026-09-27");
  });

  it("marks Sundays as closed", () => {
    const days = buildDayOptions(new Date(2026, 8, 14), 14);
    expect(days[6].iso).toBe("2026-09-20"); // Sunday
    expect(days[6].closed).toBe(true);
    expect(days[6].slots).toBe(0);
  });

  it("open days expose 6 slots", () => {
    const days = buildDayOptions(new Date(2026, 8, 14), 14);
    expect(days[0].closed).toBe(false);
    expect(days[0].slots).toBe(6);
  });

  it("formats weekday and month labels", () => {
    const days = buildDayOptions(new Date(2026, 8, 14), 1);
    expect(days[0].weekday).toBe("Mon");
    expect(days[0].month).toBe("Sep");
    expect(days[0].day).toBe(14);
  });
});

describe("usd", () => {
  it("formats whole-dollar amounts without cents", () => {
    expect(usd(240)).toBe("$240");
  });
  it("rounds to whole dollars", () => {
    expect(usd(199.5)).toBe("$200");
  });
});

describe("content invariants", () => {
  it("booking dialog services all have both vehicle prices", () => {
    for (const s of BOOKABLE_SERVICES) {
      expect(typeof s.prices.sedan).toBe("number");
      expect(typeof s.prices.suv).toBe("number");
      expect(s.prices.suv).toBeGreaterThan(s.prices.sedan);
    }
  });
});
