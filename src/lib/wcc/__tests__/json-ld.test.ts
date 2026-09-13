import { describe, expect, it } from "vitest";
import { jsonLdHtml } from "@/lib/wcc/json-ld";

/**
 * Contract for the JSON-LD serializer used by the layout script blocks.
 *
 * `dangerouslySetInnerHTML` with raw JSON.stringify output is safe only
 * while no string value contains `</script>` — one authored-content edit
 * away from a markup-injection breakout (audit cycle 5, finding A1). The
 * helper escapes `<` to its JSON unicode escape, which JSON.parse decodes
 * back, so the emitted block is both inert HTML-wise and lossless.
 */

const payload = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is the price </script><script>alert(1)</script> affected?",
      acceptedAnswer: { "@type": "Answer", answerText: "5 < 6 and 7 > 3" },
    },
  ],
};

describe("jsonLdHtml", () => {
  it("escapes every '<' so a </script> breakout is impossible", () => {
    const html = jsonLdHtml(payload);
    expect(html).not.toContain("</script>");
    expect(html).not.toContain("<");
  });

  it("produces output a JSON-LD parser can still consume (lossless round-trip)", () => {
    const html = jsonLdHtml(payload);
    const back = JSON.parse(html) as typeof payload;
    expect(back).toEqual(payload);
    expect(back.mainEntity[0].name).toContain("</script>");
  });

  it("leaves payloads without '<' byte-identical to JSON.stringify", () => {
    const safe = { "@type": "AutoWash", name: "We Care Car Care" };
    expect(jsonLdHtml(safe)).toBe(JSON.stringify(safe));
  });
});
