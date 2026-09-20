import { serializeJsonLd } from "@/lib/json-ld";

/** Structured data for crawlers and agents. See serializeJsonLd for the escape. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: serializeJsonLd escapes <
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
