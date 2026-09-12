import { renderRuleMarkdown, rules, rulesById } from "@jomae/catalog";

/**
 * One rule as markdown.
 *
 * Not the advertised URL, and not guarded either: this answers a direct GET.
 * What is advertised is `/rules/<id>.md`, which proxy.ts rewrites here, and
 * `/rules/<id>`, which reaches the same handler when the request asks for
 * markdown. Both of those are what an agent guesses.
 */
export function generateStaticParams() {
  return rules.map((rule) => ({ id: rule.id }));
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const rule = rulesById.get(id);

  if (!rule) {
    return new Response(
      `No rule with the id "${id}". The list is at /llms.txt.\n`,
      { status: 404, headers: headers("text/plain; charset=utf-8") },
    );
  }

  return new Response(renderRuleMarkdown(rule), {
    headers: headers("text/markdown; charset=utf-8"),
  });
}

/**
 * Content type only. The headers that depend on which URL was asked for are
 * set by proxy.ts, because this handler cannot tell them apart: noindex on
 * the .md alias, which duplicates the HTML page, and Vary with no-store on
 * the negotiated response at /rules/<id>. Setting noindex here would put it
 * on /rules/<id> too, and that URL is in the sitemap.
 *
 * No Vary either: this URL has one representation.
 */
function headers(
  contentType: "text/markdown; charset=utf-8" | "text/plain; charset=utf-8",
): HeadersInit {
  return {
    "Content-Type": contentType,
  };
}
