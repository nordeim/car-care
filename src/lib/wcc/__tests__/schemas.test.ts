import { describe, it, expect } from "vitest";

// B4 — extracted zod schemas (module under construction: single source of
// truth shared by API routes).
import { bookingSchema, questionSchema } from "@/lib/wcc/schemas";

const validBooking = {
  serviceKey: "premium-full",
  vehicleType: "sedan",
  serviceMode: "mobile",
  date: "2026-10-01",
  time: "09:30 AM",
  name: "Jane Doe",
  phone: "(508) 555-0123",
  email: "jane@example.com",
  address: "12 Maple St",
  city: "Natick",
  notes: "",
  addOnCeramic: false,
  company: "",
};

describe("bookingSchema", () => {
  it("accepts a valid payload", () => {
    const r = bookingSchema.safeParse(validBooking);
    expect(r.success).toBe(true);
  });

  it("rejects unknown service keys", () => {
    const r = bookingSchema.safeParse({ ...validBooking, serviceKey: "wing-and-prayer" });
    expect(r.success).toBe(false);
  });

  it("rejects invalid vehicle types", () => {
    const r = bookingSchema.safeParse({ ...validBooking, vehicleType: "boat" });
    expect(r.success).toBe(false);
  });

  it("rejects malformed phone numbers", () => {
    const r = bookingSchema.safeParse({ ...validBooking, phone: "call me maybe" });
    expect(r.success).toBe(false);
  });

  it("rejects invalid emails", () => {
    const r = bookingSchema.safeParse({ ...validBooking, email: "not-an-email" });
    expect(r.success).toBe(false);
  });

  it("rejects names that are too short", () => {
    const r = bookingSchema.safeParse({ ...validBooking, name: "J" });
    expect(r.success).toBe(false);
  });

  it("rejects unknown time slots", () => {
    const r = bookingSchema.safeParse({ ...validBooking, time: "25:99 PM" });
    expect(r.success).toBe(false);
  });

  it("rejects non-ISO dates", () => {
    const r = bookingSchema.safeParse({ ...validBooking, date: "10/01/2026" });
    expect(r.success).toBe(false);
  });

  it("keeps the honeypot field optional and tolerates long bot noise", () => {
    const r = bookingSchema.safeParse({ ...validBooking, company: "spammy spam spam" });
    expect(r.success).toBe(true);
  });

  it("defaults addOnCeramic to false when omitted", () => {
    const { addOnCeramic: _drop, ...rest } = validBooking;
    const r = bookingSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.addOnCeramic).toBe(false);
  });
});

const validQuestion = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "",
  question: "Do you detail boats or just cars and trucks?",
  company: "",
};

describe("questionSchema", () => {
  it("accepts a valid question", () => {
    const r = questionSchema.safeParse(validQuestion);
    expect(r.success).toBe(true);
  });

  it("rejects questions under 10 chars", () => {
    const r = questionSchema.safeParse({ ...validQuestion, question: "hi" });
    expect(r.success).toBe(false);
  });

  it("rejects missing emails", () => {
    const { email: _drop, ...rest } = validQuestion;
    const r = questionSchema.safeParse(rest);
    expect(r.success).toBe(false);
  });

  it("allows an empty optional phone", () => {
    const r = questionSchema.safeParse({ ...validQuestion, phone: "" });
    expect(r.success).toBe(true);
  });

  it("rejects invalid optional phones when provided", () => {
    const r = questionSchema.safeParse({ ...validQuestion, phone: "555" });
    expect(r.success).toBe(false);
  });
});
