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

/** Build the next `days` bookable days starting from a given Date (Mon–Sat open, Sun closed). */
export function buildDayOptions(from: Date, days = 14): DayOption[] {
  const options: DayOption[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const fmtWeekday = new Intl.DateTimeFormat("en-US", { weekday: "short" });
  const fmtMonth = new Intl.DateTimeFormat("en-US", { month: "short" });
  for (let i = 0; i < days; i++) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(
      cursor.getDate(),
    ).padStart(2, "0")}`;
    const closed = cursor.getDay() === 0; // Sunday
    options.push({
      iso,
      weekday: fmtWeekday.format(cursor),
      day: cursor.getDate(),
      month: fmtMonth.format(cursor),
      slots: closed ? 0 : 6,
      closed,
    });
    cursor.setDate(cursor.getDate() + 1);
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
