/**
 * Serializes structured data for a script element. Escaping `<` means no
 * string value can contain `</script>` or `<!--` and end the element early,
 * whether it is a rule title or a site constant. JSON.parse reads the escape
 * back as the original character, so the data is unchanged.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
