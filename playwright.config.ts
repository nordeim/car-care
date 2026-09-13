import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config — adapted from nordeim/home-financing playwright.config.ts
 * for car-care (single-app Next.js, output: "standalone").
 *
 * Requires a production build (`bun run build`) — `webServer` runs the
 * standalone artifact via `bun run start` (NOT `next dev`, which Next refuses
 * under standalone output anyway), so tests validate the shipped bundle and
 * not dev HMR behavior, mirroring the reference repo's audit finding that
 * dev-mode hydration can diverge from production.
 *
 * The regular dev server on :3000 is deliberately not reused: E2E runs on
 * its own port against the standalone build.
 *
 * Env:
 *   E2E_PORT     — port for webServer (default 3100; keep clear of dev :3000)
 *   E2E_BASE_URL — full base URL to reuse an external server (CI: set to reuse)
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  // Serial by design: the funnel shares one SQLite database with the server
  // process, and the booking flow is order-sensitive (step state in the dialog).
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Browsers are opt-in per environment: chromium runs everywhere this repo
    // is developed; add webkit/firefox projects when those caches are available.
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  globalTeardown: "./e2e/teardown.ts",
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // `start` runs the standalone server produced by the last `bun run
        // build` and reads DATABASE_URL from the .env Next copies into
        // .next/standalone/ at build time.
        command: "bun run start",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 90_000,
        env: { PORT: String(PORT), HOSTNAME: "127.0.0.1" },
      },
});
