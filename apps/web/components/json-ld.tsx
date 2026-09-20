/**
 * Structured data for crawlers and agents. The `<` escape keeps a rule title
 * from closing the script tag early, which is the one way JSON in a script
 * element can break out of it.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: serialized JSON with < escaped
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
