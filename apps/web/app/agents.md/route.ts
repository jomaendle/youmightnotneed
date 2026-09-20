import { ruleMarkdownUrl } from "@jomae/catalog";
import { site } from "@/lib/site";

/**
 * A short page for an agent that lands here and wants to know what to do.
 * The long form is /llms.txt. This one stays small enough to read whole.
 */
export const dynamic = "force-static";

export function GET() {
  const body = `# ${site.name} for agents

A lookup table from an npm package, or a use case, to the CSS, HTML or Web API
that now covers it. Matching is exact, against package names. No model is
involved and nothing you send is stored.

## Fetch

- ${site.url}/llms.txt: every rule by use case.
- ${ruleMarkdownUrl("<id>")}: one rule, as markdown.
- ${site.url}/llms-full.txt: every rule in one document.
- ${site.url}/openapi.json: the read-only endpoints. No authentication.

## Read the conditions before you act

Every rule carries an \`unless\` list: the cases where the dependency is still
the right call. A match means the platform might cover the use case, not that
the package can go. Check how the package is used in this codebase against
those conditions, and say which one applies. Support tiers (\`widely
available\`, \`newly available\`, \`limited\`) are derived from web-features. A
\`limited\` rule needs a fallback before anything is swapped.

## Install

\`\`\`sh
npx -y youmightnotneed@latest --verbose
npx -y youmightnotneed-mcp
\`\`\`

Claude Code: \`/plugin marketplace add jomaendle/youmightnotneed\`, then
install \`youmightnotneed\`. The skill archive is at
${site.url}/.well-known/agent-skills/index.json.

Source: ${site.repo}. Problems go in GitHub issues.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
