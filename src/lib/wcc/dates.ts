/**
 * Timezone-safe date rules for the booking API.
 *
 * The business operates in America/New_York; hosts may run UTC. All weekday
 * and window math is therefore derived from calendar (ISO) strings, not
 * from host-local Date parsing of ambiguous timestamps.
 *
 * Rules:
 *  - `new Date("YYYY-MM-DD")` (no time component) parses as UTC midnight;
 *    `getUTCDay()` on that instant is deterministic across hosts.
 *  - Window comparisons compare ISO days as ordinals (Date.UTC of the parts).
 */

export const BUSINESS_TZ = "America/New_York";
export const BOOKING_WINDOW_DAYS = 60;

/** Sunday check for an ISO date (YYYY-MM-DD), host-timezone independent. */
export function isSunday(iso: string): boolean {
  const d = new Date(`${iso}T00:00:00Z`); // UTC midnight — deterministic
  const day = d.getUTCDay();
  return day === 0 && !Number.isNaN(d.getTime());
}

function isoToUtc(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return Number.NaN;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * True when `iso` is within [todayIso, todayIso + BOOKING_WINDOW_DAYS].
 * Both arguments are ISO calendar dates (the "today" comes from the
 * business timezone, supplied by the caller).
 */
export function isWithinBookingWindow(iso: string, todayIso: string): boolean {
  const target = isoToUtc(iso);
  const today = isoToUtc(todayIso);
  if (Number.isNaN(target) || Number.isNaN(today)) return false;
  const dayMs = 86_400_000;
  const diffDays = (target - today) / dayMs;
  return diffDays >= 0 && diffDays <= BOOKING_WINDOW_DAYS;
}

/**
 * Today's ISO date in a given IANA timezone, derived from an absolute
 * instant (default: now). Uses the Intl calendar so no host-TZ leakage.
 */
export function todayIsoInTz(instant: string | number | Date = new Date(), tz: string = BUSINESS_TZ): string {
  const d = instant instanceof Date ? instant : new Date(instant);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d); // en-CA yields YYYY-MM-DD
}
