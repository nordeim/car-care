import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

// Simple in-memory sliding-window rate limit.
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

const questionSchema = z.object({
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

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 422 },
    );
  }
  const data = parsed.data;

  if (data.company) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Please call (508) 290-7476 and we'll answer directly." },
      { status: 429 },
    );
  }

  try {
    await db.question.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        question: data.question,
      },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[api/questions] create failed", error);
    return NextResponse.json(
      { error: "We couldn't send your question. Please call (508) 290-7476." },
      { status: 500 },
    );
  }
}
