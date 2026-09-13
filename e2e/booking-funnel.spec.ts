import { expect, test } from "@playwright/test";
import { cleanupTestRows, db, testMarker, TEST_EMAIL_DOMAIN } from "./helpers/db";
import { nextBookableIsoBtz } from "./helpers/dates";

/**
 * Booking funnel — the full 4-step dialog against the production build,
 * asserting SERVER truth (SQLite row) in addition to the UI state, mirroring
 * the reference repo's "assert across the reload" rigor.
 */

/** "Mon 14 Sep"-style label for an ISO date, matching buildDayOptions output. */
function dayButtonLabel(iso: string): RegExp {
  const d = new Date(`${iso}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(d);
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(d);
  // \s* — Playwright hasText matches textContent ("Mon14Sep", no separators),
  // while the rendered innerText is stack-separated ("MON\n14\nSEP").
  return new RegExp(`${weekday}\\s*${d.getUTCDate()}\\s*${month}`, "i");
}
test.describe("booking funnel", () => {
  test.afterEach(async () => {
    await cleanupTestRows();
  });

  test("full flow: service → date/time → contact → confirmation (sedan)", async ({ page }) => {
    const marker = testMarker();
    await page.goto("/");

    await page.getByRole("button", { name: "BOOK YOUR DETAIL" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "BOOK YOUR DETAIL" })).toBeVisible();

    // Step 1 — Essential Full Detail for a sedan shows the sedan price.
    // (Anchored: Premium's feature list also mentions "Essential Full Detail".)
    const essential = dialog.getByRole("button", { name: /^Essential Full Detail/ });
    await expect(essential).toContainText("$240");

    // SUV toggle updates the quoted price before continuing (dialog-level toggle).
    await dialog.getByRole("button", { name: "SUV / Truck / Van" }).click();
    await expect(essential).toContainText("$295");
    await dialog.getByRole("button", { name: "Sedan / Coupe" }).click();

    await essential.click();
    await expect(essential).toHaveAttribute("aria-pressed", "true");
    await dialog.getByRole("button", { name: "CONTINUE" }).click();

    // Step 2 — day picker: Sundays disabled, weekdays enabled.
    await expect(dialog.getByRole("heading", { name: "PICK A DAY" })).toBeVisible();
    await expect(dialog.locator("button[disabled]", { hasText: "SUN" }).first()).toBeVisible();
    // Click the specific bookable date (tomorrow-onwards, non-Sunday) so the
    // persisted row can be asserted exactly — the first enabled day could be
    // "today" on weekdays, which we deliberately do not rely on.
    const iso = nextBookableIsoBtz();
    const label = dayButtonLabel(iso);
    await dialog.locator("button", { hasText: label }).first().click();
    await dialog.getByRole("button", { name: "08:00 AM" }).click();
    await dialog.getByRole("button", { name: "CONTINUE" }).click();

    // Step 3 — contact details; mobile service requires the address fields.
    await dialog.getByRole("button", { name: /^Mobile/ }).click();
    await dialog.getByLabel("Name").fill(marker);
    await dialog.getByLabel("Phone").fill("(508) 555-0142");
    await dialog.getByLabel("Email").fill(`booking@${TEST_EMAIL_DOMAIN}`);
    await dialog.getByLabel("Address").fill("12 Playwright St");
    await dialog.getByLabel("Town").fill("Framingham");
    await dialog.getByRole("button", { name: "CONTINUE" }).click();

    // Step 4 — review summary then submit.
    await dialog.getByRole("button", { name: "REQUEST BOOKING" }).click();

    // Success: confirmation code + toast (sonner).
    await expect(dialog.getByText(/WCC-[A-Z0-9]{6}/)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("[data-sonner-toast]").first()).toContainText(
      "Booking request received",
    );

    // Server truth — the row exists with the quoted price.
    const rows = await db.booking.findMany({ where: { name: marker } });
    expect(rows).toHaveLength(1);
    expect(rows[0].serviceKey).toBe("essential-full");
    expect(rows[0].vehicleType).toBe("sedan");
    expect(rows[0].serviceMode).toBe("mobile");
    expect(rows[0].priceQuote).toBe(240);
    expect(rows[0].status).toBe("pending");
    expect(rows[0].date).toBe(nextBookableIsoBtz());
  });

  test("smart add-on preselects the 1-year ceramic checkbox", async ({ page }) => {
    await page.goto("/");
    // The Smart Add-On CTA on the Essential package card preselects ceramic.
    await page.getByRole("button", { name: "SMART ADD-ON" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "BOOK YOUR DETAIL" })).toBeVisible();
    const addOn = dialog.getByRole("checkbox");
    await expect(addOn).toBeChecked();
    // The add-on row prices the ceramic upgrade on top of the base detail.
    await expect(dialog.getByText(/1-Year Ceramic/)).toBeVisible();
    await expect(dialog.getByText(/\$200/).first()).toBeVisible();
  });
});
