import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questionSchema } from "@/lib/wcc/schemas";
import { questionRateLimiter, clientIpFrom } from "@/lib/wcc/rate-limit";

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
      {
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 422 },
    );
  }
  const data = parsed.data;

  if (data.company) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (questionRateLimiter.check(clientIpFrom(request))) {
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
