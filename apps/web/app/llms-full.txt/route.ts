import { renderRuleMarkdown, rules } from "@jomae/catalog";
import { site } from "@/lib/site";

/**
 * Every rule in one document, for an agent that would rather make one request
 * than one per rule. Same renderer as /rules/<id>.md, so the conditions for
 * keeping a dependency are in here too, not just the swaps.
 */
export const dynamic = "force-static";

export function GET() {
  const body = `# ${site.name}, full catalog

> ${site.description}

${rules.length} rules. Each section below is the same text as
${site.url}/rules/<id>.md. The short index is at ${site.url}/llms.txt.

${rules.map((rule) => renderRuleMarkdown(rule)).join("\n\n---\n\n")}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
