/**
 * The body of a 404 for a client that asked for markdown.
 *
 * No spec defines this. The shape is a status of 404, a markdown content
 * type, one sentence saying what was not found, and the two places to look
 * next. An agent that hit a dead end gets a way out rather than an HTML page
 * it has to parse.
 */
export const MARKDOWN_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
} as const;

export function markdown404(what: string): string {
  return `# Not found

${what}

- [Index of every rule](/llms.txt)
- [Browse the rules](/rules)
`;
}
