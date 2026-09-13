import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findService, quoteFor } from "@/lib/wcc/booking";
import { bookingSchema } from "@/lib/wcc/schemas";
import { isSunday } from "@/lib/wcc/dates";
import { bookingRateLimiter, clientIpFrom } from "@/lib/wcc/rate-limit";

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

  if (bookingRateLimiter.check(clientIpFrom(request))) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please call us at (508) 290-7476 to schedule." },
      { status: 429 },
    );
  }

  const service = findService(data.serviceKey);
  if (!service) {
    return NextResponse.json({ error: "Unknown service" }, { status: 422 });
  }

  // Sundays are closed (timezone-safe: weekday derived from the ISO date itself).
  if (isSunday(data.date)) {
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
