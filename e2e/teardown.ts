import { cleanupTestRows, closeDb } from "./helpers/db";

/**
 * Global teardown — belt-and-braces cleanup. Specs also delete their own rows
 * in afterEach; this guarantees nothing with the test marker survives a run
 * that failed mid-flight (Playwright still runs globalTeardown on failures).
 */
export default async function teardown(): Promise<void> {
  await cleanupTestRows();
  await closeDb();
}
