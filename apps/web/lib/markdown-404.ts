/** Content-Type for every markdown response the handlers send, 200 or 404. */
export const MARKDOWN_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
} as const;

/**
 * The body of a 404 for a client that asked for markdown.
 *
 * No spec defines this. The shape is one sentence saying what was not found
 * and the two places to look next, so an agent at a dead end gets a way out
 * rather than an HTML page to parse.
 */
export function markdown404(what: string): string {
  return `# Not found

${what}

- [Index of every rule](/llms.txt)
- [Browse the rules](/rules)
`;
}
