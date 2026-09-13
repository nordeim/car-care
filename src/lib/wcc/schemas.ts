import { z } from "zod";
import { BOOKABLE_SERVICES, TIME_SLOTS } from "@/data/wcc/content";
import { BOOKING_WINDOW_DAYS, isWithinBookingWindow, todayIsoInTz, BUSINESS_TZ } from "@/lib/wcc/dates";

/**
 * Single source of truth for booking + question payload validation.
 * Shared by the API routes (server) and usable by client code for
 * consistent error messaging.
 */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), "Invalid date")
  .refine(
    (v) => isWithinBookingWindow(v, todayIsoInTz(new Date(), BUSINESS_TZ)),
    `Date must be within the next ${BOOKING_WINDOW_DAYS} days`,
  );

export const bookingSchema = z.object({
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

export type BookingInput = z.infer<typeof bookingSchema>;

export const questionSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s().-]{7,20}$/, "Enter a valid phone")
    .optional()
    .or(z.literal("")),
  question: z.string().trim().min(10, "Tell us a little more").max(2000),
  company: z.string().max(200).optional(), // honeypot — non-empty means bot
});

export type QuestionInput = z.infer<typeof questionSchema>;
