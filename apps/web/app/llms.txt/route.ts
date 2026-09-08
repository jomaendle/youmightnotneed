import { renderUseCaseTable, ruleMarkdownUrl, rules } from "@jomae/catalog";
import { site } from "@/lib/site";

/**
 * The catalog as markdown, for anything that can fetch a URL.
 *
 * The CLI, the MCP server and the skill all need something installed. This
 * needs a GET. It carries the by-use-case table in full, because that is the
 * part that is useful before a package name is known, and points at the
 * per-rule URL for the conditions.
 *
 * A literal dotted path is a directory name, the way app/rss.xml/route.ts is
 * in Next's own docs.
 */
// Compile-time constant: the catalog is data in the bundle, not a fetch.
export const dynamic = "force-static";

export function GET() {
  const body = `# ${site.name}

> ${site.description}

Every rule maps npm packages to the CSS, HTML or Web API that covers the same
case. Matching is exact, against package names. There is no model in the loop,
so nothing here guesses what a package does.

A match is a starting point, not a verdict. A package in package.json is not
evidence of what it is used for, and every rule carries the conditions where
the dependency is still the right call. Those live on the per-rule page.

## One rule as markdown

Take a rule id from the table below:

\`\`\`sh
curl -sS ${ruleMarkdownUrl("<id>")}
\`\`\`

That URL answers with the native approach, the Baseline tier, every condition
for keeping the dependency, the swap, and links to the long-form guides.
The rule page itself answers with the same markdown when the request sends
\`Accept: text/markdown\`, and with the HTML page otherwise.

## By use case

The left column is the case the native approach covers, so it is searchable
without knowing which library you were about to reach for.

${renderUseCaseTable()}

## Checking a package.json

${site.url} takes a pasted package.json and reports what the platform covers.
Nothing is stored: the report is encoded in the URL. Offline, the same
detection runs locally:

\`\`\`sh
npx -y youmightnotneed@latest --verbose
npx -y youmightnotneed-mcp
\`\`\`

## Support

Baseline tiers are derived from web-features, never written by hand. \`widely
available\` is safe, \`newly available\` is a decision, \`limited\` needs a
fallback written before anything is swapped.

Source: ${site.repo}. ${rules.length} rules.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // The index is meant to be found. Only the per-rule markdown, which
      // duplicates an HTML page, asks not to be indexed.
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
