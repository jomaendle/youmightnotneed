import { renderRuleMarkdown, rules, rulesById } from "@jomae/catalog";
import { MARKDOWN_HEADERS, markdown404 } from "@/lib/markdown-404";

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
    return new Response(markdown404("There is no rule with that id."), {
      status: 404,
      headers: MARKDOWN_HEADERS,
    });
  }

  return new Response(renderRuleMarkdown(rule), {
    headers: MARKDOWN_HEADERS,
  });
}
