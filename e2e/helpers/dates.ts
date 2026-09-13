/**
 * Business-timezone-aware date helpers for E2E specs.
 *
 * The server validates booking dates against "today" in America/New_York
 * (BUSINESS_TZ in src/lib/wcc/dates.ts) — specs must compute dates with the
 * same anchor or they flip around midnight / on non-UTC CI machines.
 */
const BUSINESS_TZ = "America/New_York";

/** ISO date (YYYY-MM-DD) of "today" in the business timezone. */
export function todayIsoBtz(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`); // noon anchor avoids TZ edge flips
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Weekday (0=Sunday..6=Saturday) of an ISO date. */
export function weekdayOf(iso: string): number {
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}

/** Next bookable date (tomorrow onwards, skipping Sundays) in business time. */
export function nextBookableIsoBtz(): string {
  let iso = addDays(todayIsoBtz(), 1);
  while (weekdayOf(iso) === 0) iso = addDays(iso, 1);
  return iso;
}

/** The next Sunday (within 7 days) in business time — used for the closed-day rule. */
export function nextSundayIsoBtz(): string {
  let iso = addDays(todayIsoBtz(), 1);
  while (weekdayOf(iso) !== 0) iso = addDays(iso, 1);
  return iso;
}
