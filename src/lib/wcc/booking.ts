import { BOOKABLE_SERVICES, type VehicleType } from "@/data/wcc/content";

export interface BookingDraft {
  serviceKey: string;
  vehicleType: VehicleType;
  serviceMode: "mobile" | "shop" | "pickup";
  date: string; // YYYY-MM-DD
  time: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  notes?: string;
  addOnCeramic: boolean;
}

export function findService(key: string) {
  return BOOKABLE_SERVICES.find((s) => s.key === key);
}

export function quoteFor(key: string, vehicle: VehicleType, addOnCeramic: boolean): number | null {
  const svc = findService(key);
  if (!svc) return null;
  const base = svc.prices[vehicle];
  const addOn = addOnCeramic && svc.allowCeramicAddOn ? 200 : 0;
  return base + addOn;
}

export interface DayOption {
  iso: string; // YYYY-MM-DD
  weekday: string; // Mon, Tue...
  day: number;
  month: string; // short month name
  slots: number;
  closed: boolean;
}

/**
 * Build the next `days` bookable days starting from an ISO anchor date
 * (Mon–Sat open, Sun closed).
 *
 * The anchor is a calendar string — the dialog passes the business-timezone
 * "today" (`todayIsoInTz(new Date(), BUSINESS_TZ)`, PRD F2.2) so the day list
 * matches the shop's New York calendar regardless of the visitor's own
 * timezone. All label math is derived from the ISO date via UTC, so the
 * output is host-timezone independent (cycle 6, audit B1).
 */
export function buildDayOptions(anchorIso: string, days = 14): DayOption[] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(anchorIso);
  if (!m) return []; // defensive: malformed anchor yields no options
  const fmtWeekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
  const fmtMonth = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
  const options: DayOption[] = [];
  let cursorMs = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  for (let i = 0; i < days; i++) {
    const d = new Date(cursorMs);
    const closed = d.getUTCDay() === 0; // Sunday
    options.push({
      iso: d.toISOString().slice(0, 10),
      weekday: fmtWeekday.format(d),
      day: d.getUTCDate(),
      month: fmtMonth.format(d),
      slots: closed ? 0 : 6,
      closed,
    });
    cursorMs += 86_400_000;
  }
  return options;
}

export function usd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
