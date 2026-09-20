/**
 * WebMCP tool registration, github.com/webmachinelearning/webmcp.
 *
 * Chrome only and behind an origin trial at the time of writing, so on every
 * other browser `findModelContext` returns null and nothing here runs. The
 * spec puts the API on `document.modelContext`. Some guides say `navigator`,
 * so both are checked. Each tool is registered with an AbortSignal, which is
 * the spec's way to unregister it.
 */
interface ToolResult {
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

interface Tool {
  name: string;
  description: string;
  inputSchema: object;
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ModelContext {
  registerTool: (tool: Tool, options?: { signal?: AbortSignal }) => unknown;
}

export function findModelContext(
  doc: Document,
  nav: Navigator,
): ModelContext | null {
  const holder = (doc as unknown as { modelContext?: ModelContext })
    .modelContext;
  const fallback = (nav as unknown as { modelContext?: ModelContext })
    .modelContext;
  const context = holder ?? fallback;
  return typeof context?.registerTool === "function" ? context : null;
}

const text = (value: string, isError = false): ToolResult => ({
  content: [{ type: "text", text: value }],
  ...(isError ? { isError } : {}),
});

/** What the tools need from the page, passed in so a test can fake it. */
export interface WebMcpDeps {
  fetchRule: (id: string) => Promise<Response>;
  /** The scan server action. On success it redirects to the report. */
  scan: (input: string) => Promise<{ error?: string } | undefined>;
}

export function registerWebMcpTools(
  context: ModelContext,
  signal: AbortSignal,
  deps: WebMcpDeps,
): void {
  context.registerTool(
    {
      name: "get_rule",
      description:
        "Read one rule as markdown: the native replacement, its support tier, and every condition under which the package is still the right call. Rule ids are listed at /llms.txt.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "A rule id, e.g. dialog-element" },
        },
        required: ["id"],
      },
      async execute({ id }) {
        if (typeof id !== "string" || id === "") {
          return text("id must be a non-empty string.", true);
        }
        const response = await deps.fetchRule(id);
        return text(await response.text(), !response.ok);
      },
    },
    { signal },
  );

  context.registerTool(
    {
      name: "scan_dependencies",
      description:
        "Check a package.json, or a public owner/repo, against the catalog. On success the page opens the report. Nothing is stored: the report lives in the URL.",
      inputSchema: {
        type: "object",
        properties: {
          input: {
            type: "string",
            description: "The full text of a package.json, or owner/repo",
          },
        },
        required: ["input"],
      },
      async execute({ input }) {
        if (typeof input !== "string" || input.trim() === "") {
          return text("input must be a package.json or owner/repo.", true);
        }
        const result = await deps.scan(input);
        // A successful scan redirects, so the page is already navigating.
        return result?.error
          ? text(result.error, true)
          : text("Scan complete. The report is open in this tab.");
      },
    },
    { signal },
  );
}
