import { expect, test } from "@playwright/test";
import { cleanupTestRows, db, testMarker, TEST_EMAIL_DOMAIN } from "./helpers/db";
import { nextBookableIsoBtz, nextSundayIsoBtz } from "./helpers/dates";

/**
 * API contract — request-fixture tests for /api/bookings and /api/questions.
 * Every test uses a unique x-forwarded-for so the in-memory sliding-window
 * limiter (5 per IP / 10 min, per process) never bleeds across tests.
 */

function bookingPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    serviceKey: "essential-full",
    vehicleType: "sedan",
    serviceMode: "mobile",
    date: nextBookableIsoBtz(),
    time: "08:00 AM",
    name: testMarker(),
    phone: "(508) 555-0142",
    email: `api@${TEST_EMAIL_DOMAIN}`,
    address: "12 Playwright St",
    city: "Framingham",
    notes: "",
    addOnCeramic: false,
    ...overrides,
  };
}

function questionPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: testMarker(),
    email: `question@${TEST_EMAIL_DOMAIN}`,
    question: "Do you offer ceramic coating for trucks, and what does it cost?",
    ...overrides,
  };
}

test.describe("bookings API", () => {
  test.afterEach(async () => {
    await cleanupTestRows();
  });

  test("invalid JSON body returns 400 JSON", async ({ request }) => {
    // Use raw fetch: Playwright's request fixture JSON-stringifies string
    // `data` (making it valid JSON — a string), which reaches zod instead.
    const base = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${process.env.E2E_PORT ?? 3100}`;
    const resp = await fetch(`${base}/api/bookings`, {
      method: "POST",
      body: "not-json{",
      headers: { "content-type": "application/json", "x-forwarded-for": `pw-400-${Date.now()}` },
    });
    expect(resp.status).toBe(400);
    expect(resp.headers.get("content-type")).toContain("application/json");
    expect(((await resp.json()) as { error: string }).error).toContain("Invalid JSON");
  });

  test("schema violations return 422 with issue details", async ({ request }) => {
    const resp = await request.post("/api/bookings", {
      data: bookingPayload({ name: "x", email: "not-an-email" }),
      headers: { "x-forwarded-for": `pw-422-${Date.now()}` },
    });
    expect(resp.status()).toBe(422);
    const body = (await resp.json()) as { error: string; issues: Array<{ path: string[] }> };
    expect(body.error).toBe("Validation failed");
    expect(body.issues.length).toBeGreaterThan(0);
    expect(resp.headers()["content-type"]).toContain("application/json");
  });

  test("unknown service key returns 422", async ({ request }) => {
    const resp = await request.post("/api/bookings", {
      data: bookingPayload({ serviceKey: "platinum-super-detail" }),
      headers: { "x-forwarded-for": `pw-svc-${Date.now()}` },
    });
    expect(resp.status()).toBe(422);
  });

  test("sunday dates are rejected (timezone-safe closed rule)", async ({ request }) => {
    const resp = await request.post("/api/bookings", {
      data: bookingPayload({ date: nextSundayIsoBtz() }),
      headers: { "x-forwarded-for": `pw-sun-${Date.now()}` },
    });
    expect(resp.status()).toBe(422);
    expect(((await resp.json()) as { error: string }).error).toContain("Sundays");
  });

  test("dates outside the 60-day window are rejected", async ({ request }) => {
    const resp = await request.post("/api/bookings", {
      data: bookingPayload({ date: "2020-01-01" }),
      headers: { "x-forwarded-for": `pw-win-${Date.now()}` },
    });
    expect(resp.status()).toBe(422);
  });

  test("mobile service without address is rejected", async ({ request }) => {
    const resp = await request.post("/api/bookings", {
      data: bookingPayload({ address: "" }),
      headers: { "x-forwarded-for": `pw-addr-${Date.now()}` },
    });
    expect(resp.status()).toBe(422);
    expect(((await resp.json()) as { error: string }).error).toContain("address");
  });

  test("honeypot returns fake success and writes no row", async ({ request }) => {
    const marker = testMarker();
    const resp = await request.post("/api/bookings", {
      data: bookingPayload({ name: marker, company: "Totally Legit SEO Co" }),
      headers: { "x-forwarded-for": `pw-hp-${Date.now()}` },
    });
    expect(resp.status()).toBe(201);
    expect(((await resp.json()) as { confirmation: string }).confirmation).toBe("WCC-000000");
    expect(await db.booking.count({ where: { name: marker } })).toBe(0);
  });

  test("burst from one IP hits the 429 rate limit with a JSON body", async ({ request }) => {
    const burstIp = `pw-429-${Date.now()}`;
    let last = null as Awaited<ReturnType<typeof request.post>> | null;
    for (let i = 0; i < 6; i++) {
      // Sunday payloads pass schema + limiter ordering but never write a row.
      last = await request.post("/api/bookings", {
        data: bookingPayload({ date: nextSundayIsoBtz() }),
        headers: { "x-forwarded-for": burstIp },
      });
    }
    expect(last?.status()).toBe(429);
    expect(last?.headers()["content-type"]).toContain("application/json");
    const body = (await last!.json()) as { error: string };
    expect(body.error).toContain("(508) 290-7476");
  });

  test("oversized payload is rejected with 413 before parsing", async ({ request }) => {
    // ~64KB of notes: far above the 32KB guard, far below anything zod should
    // have to walk. The route must refuse the payload without parsing it.
    const resp = await request.post("/api/bookings", {
      data: bookingPayload({ notes: "x".repeat(64 * 1024) }),
      headers: { "x-forwarded-for": `pw-413-${Date.now()}` },
    });
    expect(resp.status()).toBe(413);
    expect(((await resp.json()) as { error: string }).error).toContain("too large");
  });

  test("valid booking returns 201 with quote and persists the row", async ({ request }) => {
    const marker = testMarker();
    const resp = await request.post("/api/bookings", {
      data: bookingPayload({
        name: marker,
        vehicleType: "suv",
        addOnCeramic: true,
      }),
      headers: { "x-forwarded-for": `pw-ok-${Date.now()}` },
    });
    expect(resp.status()).toBe(201);
    const body = (await resp.json()) as { ok: boolean; confirmation: string; priceQuote: number };
    expect(body.ok).toBe(true);
    expect(body.confirmation).toMatch(/^WCC-[A-Z0-9]{6}$/);
    // essential SUV 295 + ceramic add-on 200
    expect(body.priceQuote).toBe(495);

    const rows = await db.booking.findMany({ where: { name: marker } });
    expect(rows).toHaveLength(1);
    expect(rows[0].priceQuote).toBe(495);
    expect(rows[0].addOnCeramic).toBe(true);
  });
});

test.describe("questions API", () => {
  test.afterEach(async () => {
    await cleanupTestRows();
  });

  test("valid question returns 201 and persists", async ({ request }) => {
    const marker = testMarker();
    const resp = await request.post("/api/questions", {
      data: questionPayload({ name: marker }),
      headers: { "x-forwarded-for": `pw-q-ok-${Date.now()}` },
    });
    expect(resp.status()).toBe(201);
    expect(((await resp.json()) as { ok: boolean }).ok).toBe(true);
    const rows = await db.question.findMany({ where: { name: marker } });
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe(`question@${TEST_EMAIL_DOMAIN}`);
  });

  test("short question text is rejected with 422", async ({ request }) => {
    const resp = await request.post("/api/questions", {
      data: questionPayload({ question: "hi" }),
      headers: { "x-forwarded-for": `pw-q-422-${Date.now()}` },
    });
    expect(resp.status()).toBe(422);
  });

  test("oversized question payload is rejected with 413", async ({ request }) => {
    const resp = await request.post("/api/questions", {
      data: questionPayload({
        name: testMarker(),
        question: "Do you offer ceramic coating? " + "x".repeat(64 * 1024),
      }),
      headers: { "x-forwarded-for": `pw-q-413-${Date.now()}` },
    });
    expect(resp.status()).toBe(413);
  });

  test("question honeypot returns fake 201 and writes no row", async ({ request }) => {
    const marker = testMarker();
    const resp = await request.post("/api/questions", {
      data: questionPayload({ name: marker, company: "Bot Industries" }),
      headers: { "x-forwarded-for": `pw-q-hp-${Date.now()}` },
    });
    expect(resp.status()).toBe(201);
    expect(await db.question.count({ where: { name: marker } })).toBe(0);
  });
});
