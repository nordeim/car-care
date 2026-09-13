import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accessibility gate — axe-core on the landing page. Policy (audit cycle 2):
 * critical AND serious violations fail the build. Cycle-1 shipped with a
 * critical-only gate; cycle 2 tightened it after remediating the serious
 * findings (aria-allowed-attr on star-rating spans, label-content-name-
 * mismatch on the logo link — see docs/audit-e2e-2026-09.md).
 */
test.describe("accessibility", () => {
  test("no critical or serious axe violations on the landing page", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(
      blocking,
      `critical/serious a11y violations: ${JSON.stringify(
        blocking.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
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
