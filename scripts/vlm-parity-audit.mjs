import fs from "node:fs";
import path from "node:path";
import ZAI from "z-ai-web-dev-sdk";

/**
 * Visual parity audit — compares aligned section screenshots of the local
 * build (127.0.0.1:3100) against the source site (wecarecarcare.com).
 * Prints a structured report to stdout and writes JSON next to the images.
 */
const BASE = "tool-results/visual-audit-2026-09-13";

const PAIRS = [
  { name: "hero", source: "source/section-00.png", local: "local/section-00.png" },
  { name: "difference (before/after)", source: "source/section-01.png", local: "local/section-01.png" },
  { name: "pricing packages", source: "source/section-02.png", local: "local/section-02.png" },
  { name: "ceramic intro", source: "source/section-03.png", local: "local/section-03.png" },
  {
    name: "ceramic hydrophobic demo",
    source: "source/section-04.png",
    local: "local/section-04.png",
    note: "source renders this as a standalone 'Same Dirt. Completely Different Result.' section; local embeds the hydrophobic slider inside its ceramic flow — a documented deliberate divergence",
  },
  { name: "ceramic tiers", source: "source/section-06.png", local: "local/section-04.png" },
  { name: "interior-only", source: "source/section-07.png", local: "local/section-05.png" },
  { name: "testimonials", source: "source/section-08.png", local: "local/section-06.png" },
  { name: "faq", source: "source/section-09.png", local: "local/section-07.png" },
  { name: "final cta", source: "source/section-10.png", local: "local/section-08.png" },
  { name: "footer", source: "source/section-11.png", local: "local/section-09.png" },
];

function toDataUrl(file) {
  const buf = fs.readFileSync(path.join(BASE, file));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

async function main() {
  const zai = await ZAI.create();
  const results = [];

  for (const pair of PAIRS) {
    const prompt = `You are auditing a local redesign clone ("LOCAL", image 2) against the original website ("SOURCE", image 1) for section: "${pair.name}".
${pair.note ? `Known deliberate divergence: ${pair.note}.\n` : ""}Compare the two screenshots on: layout structure, typography hierarchy, color palette (accent usage), imagery treatment, spacing, call-to-action styling, and overall visual fidelity.
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
      const content = response.choices[0]?.message?.content ?? "(no content)";
      console.log(`\n===== ${pair.name} =====\n${content}`);
      results.push({ section: pair.name, analysis: content });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`\n===== ${pair.name} =====\nERROR: ${message}`);
      results.push({ section: pair.name, error: message });
    }
  }

  fs.writeFileSync(
    path.join(BASE, "vlm-comparison.json"),
    JSON.stringify(results, null, 2),
  );
  console.log("\n\nSaved: " + path.join(BASE, "vlm-comparison.json"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
