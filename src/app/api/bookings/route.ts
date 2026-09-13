import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { BOOKABLE_SERVICES, TIME_SLOTS } from "@/data/wcc/content";
import { findService, quoteFor } from "@/lib/wcc/booking";

// Simple in-memory sliding-window rate limit (per process; SQLite-backed
// persistence makes the booking itself durable).
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
  .refine((v) => {
    const d = new Date(`${v}T00:00:00`);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 60);
    return d >= today && d <= maxDate;
  }, "Date must be within the next 60 days");

const bookingSchema = z.object({
  serviceKey: z.string().refine((k) => BOOKABLE_SERVICES.some((s) => s.key === k), "Unknown service"),
  vehicleType: z.enum(["sedan", "suv"]),
  serviceMode: z.enum(["mobile", "shop", "pickup"]),
  date: isoDate,
  time: z.string().refine((t) => (TIME_SLOTS as readonly string[]).includes(t), "Unknown time slot"),
  name: z.string().trim().min(2, "Name is too short").max(80),
  phone: z.string().trim().regex(/^\+?[\d\s().-]{7,20}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email"),
  address: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  addOnCeramic: z.boolean().default(false),
  company: z.string().max(200).optional(), // honeypot — non-empty means bot
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 422 },
    );
  }
  const data = parsed.data;

  if (data.company) {
    // Honeypot tripped — pretend success so bots learn nothing.
    return NextResponse.json({ ok: true, confirmation: "WCC-000000" }, { status: 201 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please call us at (508) 290-7476 to schedule." },
      { status: 429 },
    );
  }

  const service = findService(data.serviceKey);
  if (!service) {
    return NextResponse.json({ error: "Unknown service" }, { status: 422 });
  }

  // Sundays are closed.
  if (new Date(`${data.date}T00:00:00`).getDay() === 0) {
    return NextResponse.json(
      { error: "We're closed on Sundays — please pick another day." },
      { status: 422 },
    );
  }

  if (data.serviceMode !== "shop" && !data.address) {
    return NextResponse.json(
      { error: "An address is required for mobile service and pickup & delivery." },
      { status: 422 },
    );
  }

  const priceQuote = quoteFor(data.serviceKey, data.vehicleType, data.addOnCeramic);

  try {
    const booking = await db.booking.create({
      data: {
        serviceKey: data.serviceKey,
        serviceName: service.name,
        vehicleType: data.vehicleType,
        serviceMode: data.serviceMode,
        date: data.date,
        time: data.time,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address || null,
        city: data.city || null,
        notes: data.notes || null,
        priceQuote,
        addOnCeramic: data.addOnCeramic,
      },
    });

    const confirmation = `WCC-${booking.id.slice(-6).toUpperCase()}`;
    return NextResponse.json({ ok: true, confirmation, priceQuote }, { status: 201 });
  } catch (error) {
    console.error("[api/bookings] create failed", error);
    return NextResponse.json(
      {
        error:
          "We couldn't save your booking. Please call (508) 290-7476 and we'll get you on the schedule.",
      },
      { status: 500 },
    );
  }
}
