import fs from "node:fs";
import path from "node:path";
import ZAI from "z-ai-web-dev-sdk";

/**
 * Live visual parity audit — compares LIVE site (car-care.jesspete.shop)
 * screenshots against the source site (wecarecarcare.com).
 *
 * Usage: bun scripts/live-parity-vlm.mjs [screenshot-dir]
 * The directory must contain source-desktop-hero.png / clone-desktop-hero.png
 * (and the mobile pair). Capture them with agent-browser, e.g.:
 *   agent-browser open https://car-care.jesspete.shop/ && agent-browser screenshot <dir>/clone-desktop-hero.png
 *   agent-browser --session source open https://wecarecarcare.com/ && agent-browser --session source screenshot <dir>/source-desktop-hero.png
 */
const BASE = process.argv[2] ?? ".";

const PAIRS = [
  { name: "desktop hero", source: "source-desktop-hero.png", local: "clone-desktop-hero.png" },
  { name: "mobile hero", source: "source-mobile-hero.png", local: "clone-mobile-hero.png" },
];

function toDataUrl(file) {
  const buf = fs.readFileSync(path.join(BASE, file));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

async function main() {
  const zai = await ZAI.create();
  const results = [];

  for (const pair of PAIRS) {
    const prompt = `You are auditing a deployed clone ("LIVE", image 2) against the original website ("SOURCE", image 1) for section: "${pair.name}".
The clone intentionally uses a dark-first redesign (warm charcoal + amber/teal accents, Oswald/Archivo type) while preserving structure, copy intent, pricing, and CTAs of the source.
Compare the two screenshots on: layout structure, typography hierarchy, imagery treatment, spacing, call-to-action styling, and overall visual fidelity given the deliberate dark redesign.
Reply in EXACTLY this format:
FIDELITY: <high|medium|low>
GAPS: <one line listing concrete visual gaps or differences, or "none">
VERDICT: <one sentence>`;

    try {
      const response = await zai.chat.completions.createVision({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: toDataUrl(pair.source) } },
              { type: "image_url", image_url: { url: toDataUrl(pair.local) } },
            ],
          },
        ],
        thinking: { type: "disabled" },
      });
      const text = response.choices[0]?.message?.content ?? "";
      results.push({ name: pair.name, report: text.trim() });
      console.log(`\n=== ${pair.name} ===\n${text.trim()}`);
    } catch (err) {
      results.push({ name: pair.name, error: String(err) });
      console.error(`\n=== ${pair.name} === VLM ERROR: ${err}`);
    }
  }

  fs.writeFileSync(
    path.join(BASE, "live-parity-report.json"),
    JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2),
  );
  console.log("\nSaved: live-parity-report.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
