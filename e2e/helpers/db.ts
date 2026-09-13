import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

/**
 * Shared DB access for E2E specs. Playwright workers and the global teardown
 * run in plain Node (no Next env loading), so resolve DATABASE_URL the same
 * way the app does: env var first, then the repo's .env file.
 *
 * Spec files must import this module ONCE per worker (top-level import) —
 * the client is created after the env var is guaranteed to be set.
 */
if (!process.env.DATABASE_URL) {
  const raw = fs.readFileSync(".env", "utf8");
  const match = raw.match(/^DATABASE_URL\s*=\s*(.+)$/m);
  if (!match) {
    throw new Error("e2e/db: DATABASE_URL is not set and .env has no DATABASE_URL line");
  }
  process.env.DATABASE_URL = match[1].trim();
}

/** Marker used by every row a spec creates — teardown deletes by this prefix. */
export const TEST_NAME_PREFIX = "PW E2E";
export const TEST_EMAIL_DOMAIN = "pw-e2e.test";

export const db = new PrismaClient();

/** Delete every test-written row (bookings + questions). Idempotent. */
export async function cleanupTestRows(): Promise<void> {
  await db.booking.deleteMany({ where: { name: { startsWith: TEST_NAME_PREFIX } } });
  await db.question.deleteMany({ where: { name: { startsWith: TEST_NAME_PREFIX } } });
}

export async function closeDb(): Promise<void> {
  await db.$disconnect();
}

/** Unique per-run marker (avoids collisions with rows from previous runs). */
export function testMarker(): string {
  return `${TEST_NAME_PREFIX} ${Date.now()}`;
}
