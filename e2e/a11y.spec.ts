import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accessibility gate — axe-core on the landing page. Mirrors the reference
 * repo's policy: critical violations fail the build; serious/moderate
 * findings are triaged (documented in the audit doc) rather than hard-failed,
 * because several decorative dark-theme choices (contrast on photography
 * overlays) are deliberate design decisions.
 */
test.describe("accessibility", () => {
  test("no critical axe violations on the landing page", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(
      critical,
      `critical a11y violations: ${JSON.stringify(
        critical.map((v) => ({ id: v.id, nodes: v.nodes.length })),
        null,
        2,
      )}`,
    ).toEqual([]);
  });

  test("booking dialog (when open) introduces no critical violations", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "BOOK YOUR DETAIL" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const results = await new AxeBuilder({ page }).include("[role='dialog']").analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
});
