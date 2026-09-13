import { expect, test } from "@playwright/test";

/**
 * Smoke — the critical surfaces that must render on the production standalone
 * build (webServer runs `bun run start`, never `next dev`).
 */
test.describe("home smoke", () => {
  test("renders hero, nav, and footer", async ({ page }) => {
    await page.goto("/");
    // The h1 carries a <br/> — innerText may collapse the space ("Your CarDeserves").
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/car\s*deserves\s*better/i);
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("renders all eight landing sections", async ({ page }) => {
    await page.goto("/");
    for (const heading of [
      /REAL RESULTS/i,
      /CHOOSE YOUR LEVEL OF DETAIL/i,
      /A GREAT DETAIL IS STEP ONE/i,
      /PROTECT YOUR PAINT/i,
      /ONLY NEED THE INTERIOR DONE/i,
      /REAL PEOPLE\. REAL RESULTS\./i,
      /FREQUENTLY ASKED QUESTIONS/i,
      /YOUR VEHICLE WON'T WAIT\./i,
    ]) {
      await expect(page.getByRole("heading", { level: 2, name: heading }).first()).toBeVisible();
    }
  });

  test("dual sedan/SUV prices visible without interaction (v1.1.0 parity fix)", async ({ page }) => {
    await page.goto("/");
    const packages = page.getByRole("heading", { level: 3, name: /Full Detail|Interior Detail/ });
    await expect(packages).toHaveCount(3);
    // Both package cards show dual price rows (sedan + SUV) inside the pricing
    // section; the interior card repeats $240 for its SUV row, so scope tightly.
    const pricing = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: /choose your level/i }) });
    await expect(pricing.getByText("$240", { exact: true })).toBeVisible(); // essential sedan
    await expect(pricing.getByText("$295", { exact: true })).toBeVisible(); // essential SUV
    await expect(pricing.getByText("$360", { exact: true })).toBeVisible(); // premium sedan
    await expect(pricing.getByText("$395", { exact: true })).toBeVisible(); // premium SUV
    const interior = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: /only need the interior/i }) });
    await expect(interior.getByText("$195", { exact: true })).toBeVisible(); // interior sedan
    await expect(interior.getByText(/or \$240 for SUV/i)).toBeVisible(); // interior SUV
  });

  test("before/after comparison sliders render and respond", async ({ page }) => {
    await page.goto("/");
    const sliders = page.getByRole("slider");
    // Three drag-compare sliders: interior, exterior, and the ceramic
    // hydrophobic demo in the ceramic upsell section.
    await expect(sliders).toHaveCount(3);
    await expect(sliders.first()).toHaveAccessibleName(/interior transformation/i);
    // Keyboard is deterministic: step is ±5 with clamps at 4 and 96 (the
    // divider always keeps a sliver of both states visible).
    const first = sliders.first();
    await first.focus();
    for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
    await expect(first).toHaveAttribute("aria-valuenow", "70"); // 50 + 4×5
    for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowRight");
    await expect(first).toHaveAttribute("aria-valuenow", "96"); // clamped
    for (let i = 0; i < 20; i++) await page.keyboard.press("ArrowLeft");
    await expect(first).toHaveAttribute("aria-valuenow", "4"); // clamped
  });

  test("all images load (no broken src)", async ({ page }) => {
    await page.goto("/");
    // Force every loading="lazy" image to actually start loading by scrolling
    // it into the viewport, then poll until every fetch settles (errors count
    // as settled — they still leave naturalWidth 0, which we assert on).
    await page.evaluate(async () => {
      for (const img of Array.from(document.images)) {
        img.scrollIntoView({ block: "center" });
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      const deadline = Date.now() + 5000;
      while (
        Date.now() < deadline &&
        Array.from(document.images).some((img) => !img.complete)
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    });
    const broken = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.src),
    );
    expect(broken).toEqual([]);
  });

  test("no console errors or uncaught exceptions on load + scroll", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.goto("/");
    // Trigger the scroll-reveal animations and the mobile FAB logic.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);
    expect(errors).toEqual([]);
  });

  test("mobile: nav collapses to hamburger and call FAB appears after scroll", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("button", { name: /menu/i })).toBeVisible();
    // The FAB is always in the DOM — "hidden" is expressed via opacity 0 +
    // pointer-events none, so assert the CSS transition state, not visibility.
    const fab = page.locator('a[aria-label^="Call We Care"]');
    await expect(fab).toHaveCSS("opacity", "0");
    await page.evaluate(() => window.scrollTo(0, 800));
    await expect(fab).toHaveCSS("opacity", "1");
    await expect(fab).toHaveAttribute("href", /^tel:/);
  });

  test("404 renders a recovery heading", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-xyz");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("well-known assets resolve: sitemap, robots, icon", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect((await sitemap.text())).toContain("<urlset");

    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toMatch(/sitemap/i);

    const icon = await request.get("/icon.svg");
    expect(icon.status()).toBe(200);
    expect(icon.headers()["content-type"]).toContain("svg");
  });
});
