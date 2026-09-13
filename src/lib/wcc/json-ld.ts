/**
 * JSON-LD serializer for the layout's structured-data script blocks.
 *
 * `JSON.stringify` output injected via `dangerouslySetInnerHTML` is inert
 * only while no string value contains `</script>` — one authored-content
 * edit away from terminating the block early (markup injection). `<` can
 * only appear inside JSON string values (structural JSON never contains
 * it), so escaping every `<` to its JSON unicode escape is always safe and
 * lossless: JSON.parse decodes `\u003c` back to `<`.
 *
 * Contract: `src/lib/wcc/__tests__/json-ld.test.ts` (audit cycle 5, A1).
 */
export function jsonLdHtml(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
