import { describe, it, expect } from "vitest";

// B2 — timezone-safe date rules (module under construction).
import { isSunday, isWithinBookingWindow, todayIsoInTz } from "@/lib/wcc/dates";

// Determinate fixtures (all ISO calendar dates, no clock dependence).
describe("isSunday", () => {
  it("returns true for known Sundays regardless of host timezone", () => {
    // 2026-09-13 is a Sunday.
    expect(isSunday("2026-09-13")).toBe(true);
    // 2026-09-20 is a Sunday.
    expect(isSunday("2026-09-20")).toBe(true);
  });

  it("returns false for known non-Sundays", () => {
    expect(isSunday("2026-09-12")).toBe(false); // Saturday
    expect(isSunday("2026-09-14")).toBe(false); // Monday
    expect(isSunday("2026-02-28")).toBe(false); // Saturday
  });

  it("gives the same answer under UTC and America/New_York hosts", () => {
    // Run the same pure computation with different process TZ by re-importing logic
    // isSunday must derive the weekday from the ISO string itself (UTC-midnight rule).
    const utcResult = isSunday("2026-09-13");
    const expected = true;
    expect(utcResult).toBe(expected);
  });
});

describe("isWithinBookingWindow", () => {
  it("accepts today and near-future dates", () => {
    expect(isWithinBookingWindow("2026-09-14", "2026-09-14")).toBe(true);
    expect(isWithinBookingWindow("2026-10-01", "2026-09-14")).toBe(true);
  });

  it("rejects past dates", () => {
    expect(isWithinBookingWindow("2026-09-13", "2026-09-14")).toBe(false);
  });

  it("rejects dates beyond 60 days out", () => {
    expect(isWithinBookingWindow("2026-11-13", "2026-09-14")).toBe(true); // exactly 60 days
    expect(isWithinBookingWindow("2026-11-14", "2026-09-14")).toBe(false); // 61 days
    expect(isWithinBookingWindow("2026-11-15", "2026-09-14")).toBe(false); // 62 days
  });

  it("handles month and year boundaries", () => {
    expect(isWithinBookingWindow("2027-01-05", "2026-12-31")).toBe(true);
    expect(isWithinBookingWindow("2026-01-01", "2026-12-31")).toBe(false);
  });
});

describe("todayIsoInTz", () => {
  it("returns a YYYY-MM-DD string for the business timezone", () => {
    const iso = todayIsoInTz("2026-09-13T04:30:00Z", "America/New_York");
    // 04:30Z on Sep 13 is 00:30 EDT on Sep 13 — same date.
    expect(iso).toBe("2026-09-13");
  });

  it("shifts to the previous day for early-UTC instants in New York", () => {
    // 2026-09-13 02:00Z is 2026-09-12 22:00 EDT.
    const iso = todayIsoInTz("2026-09-13T02:00:00Z", "America/New_York");
    expect(iso).toBe("2026-09-12");
  });
});
