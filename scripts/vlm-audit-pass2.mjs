import fs from "node:fs";
import path from "node:path";
import ZAI from "z-ai-web-dev-sdk";

/**
 * Second-pass VLM audit — the local site is an intentional DARK-THEME REDESIGN
 * of the source (documented divergence: dark-first visual language, original
 * copy, AI-generated imagery). This pass asks for UX/structure parity and
 * actionable design gaps, NOT pixel identity.
 */
const BASE = "tool-results/visual-audit-2026-09-13";

const PAIRS = [
  { name: "testimonials", source: "source/section-08.png", local: "local/testimonials-resettled.png" },
  { name: "final cta", source: "source/section-10.png", local: "local/final-cta-resettled.png" },
  { name: "ceramic tiers", source: "source/section-06.png", local: "local/section-04.png" },
  { name: "hero", source: "source/section-00.png", local: "local/section-00.png" },
];

function toDataUrl(file) {
  const buf = fs.readFileSync(path.join(BASE, file));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

async function main() {
  const zai = await ZAI.create();
  for (const pair of PAIRS) {
    const prompt = `CONTEXT: Image 1 is the ORIGINAL website section ("${pair.name}"). Image 2 is the same section of an intentional dark-theme REDESIGN of the same business site (same content, same business, different but deliberate visual language: dark charcoal + amber, condensed layout).

Judge PARITY OF UX AND INFORMATION ARCHITECTURE between the two, not pixel identity. Consider: does the redesign section deliver the same user-facing information, hierarchy of importance, primary action, trust signals, and interaction affordances as the original?

List up to 3 CONCRETE, actionable gaps where the redesign is objectively MISSING something the original communicates (e.g., a missing trust signal, a missing primary CTA, missing review count, wrong emphasis). Ignore differences in colors, fonts, imagery style, and exact wording — those are deliberate redesign choices.

Reply EXACTLY:
PARITY: <strong|adequate|weak>
GAPS: <numbered list, max 3 concrete items, or "none">
NOTES: <one sentence>`;

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
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
