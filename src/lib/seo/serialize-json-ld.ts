/**
 * Serialize JSON-LD for inline script output. Mitigates `</script>`-style
 * breaks via unicode escapes (Next.js JSON-LD guide).
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
