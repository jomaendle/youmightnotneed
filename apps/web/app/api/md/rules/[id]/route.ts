import { renderRuleMarkdown, rules, rulesById } from "@jomae/catalog";

/**
 * One rule as markdown.
 *
 * Internal. The public URL is `/rules/<id>.md`, which proxy.ts rewrites here,
 * and `/rules/<id>` reaches the same handler when the request asks for
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
 * noindex because this is the same content as the HTML rule page, which
 * carries the canonical. Two indexable copies of every rule is the
 * duplicate-content problem in a new coat.
 *
 * No Vary here: this URL has one representation. proxy.ts adds Vary and
 * no-store to the response it negotiates at /rules/<id>, which is the only
 * one that has two.
 */
function headers(contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "X-Robots-Tag": "noindex",
  };
}
