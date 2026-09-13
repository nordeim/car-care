import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Live axe-core accessibility scan on https://car-care.jesspete.shop
 * Mirrors e2e/a11y.spec.ts gates: critical + serious violations must be 0.
 */
const URL = process.env.LIVE_URL ?? "https://car-care.jesspete.shop/";

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });

  // Scroll through the page so lazy content mounts before scanning.
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const serious = results.violations.filter((v) =>
    ["critical", "serious"].includes(v.impact ?? ""),
  );
  const moderate = results.violations.filter((v) => v.impact === "moderate");
  const minor = results.violations.filter((v) => v.impact === "minor");

  console.log(`axe violations: critical/serious=${serious.length}, moderate=${moderate.length}, minor=${minor.length}`);
  for (const v of results.violations) {
    console.log(`- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`);
  }
  await browser.close();

  if (serious.length > 0) {
    console.log("FAIL: critical/serious violations present");
    process.exit(1);
  }
  console.log("PASS: no critical/serious violations (gate matches e2e/a11y.spec.ts)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
