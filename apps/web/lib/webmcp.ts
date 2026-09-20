/**
 * WebMCP tool registration, github.com/webmachinelearning/webmcp.
 *
 * An enhancement for browsers that ship the API (Chrome behind an origin
 * trial, checked September 2026). Everywhere else `findModelContext` returns
 * null and nothing here runs, and nothing here may break the page when the
 * API exists but behaves differently: every registration and every tool body
 * is guarded. The spec puts the API on `document.modelContext`. Some guides
 * say `navigator`, so both are checked. Each tool is registered with an
 * AbortSignal, which is the spec's way to unregister it.
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

function isModelContext(value: unknown): value is ModelContext {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { registerTool?: unknown }).registerTool === "function"
  );
}

interface Holder {
  modelContext?: unknown;
}

export function findModelContext(
  doc: Document,
  nav: Navigator,
): ModelContext | null {
  const candidate =
    (doc as Holder).modelContext ?? (nav as Holder).modelContext;
  return isModelContext(candidate) ? candidate : null;
}

const text = (value: string, isError = false): ToolResult => ({
  content: [{ type: "text", text: value }],
  ...(isError ? { isError } : {}),
});

const message = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

/** What the tools need from the page, passed in so a test can fake it. */
export interface WebMcpDeps {
  fetchRule: (id: string) => Promise<Response>;
  /**
   * The scan server action. It returns `{error}` for input it rejects. On
   * success it redirects, so a caller usually never sees a return value.
   */
  scan: (input: string) => Promise<{ error?: string } | undefined>;
}

function register(
  context: ModelContext,
  signal: AbortSignal,
  tool: Tool,
): void {
  try {
    context.registerTool(tool, { signal });
  } catch (error) {
    // An enhancement must not take the page down, or stop the next tool
    // from registering. A duplicate name is the likeliest cause.
    console.warn(`[webmcp] could not register ${tool.name}:`, message(error));
  }
}

export function registerWebMcpTools(
  context: ModelContext,
  signal: AbortSignal,
  deps: WebMcpDeps,
): void {
  register(context, signal, {
    name: "get_rule",
    description:
      "Read one rule as markdown: the native replacement, its support tier, and the conditions under which the package is still the right call. Rule ids are listed at /llms.txt.",
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
      try {
        const response = await deps.fetchRule(id);
        const body = await response.text();
        return response.ok
          ? text(body)
          : text(`HTTP ${response.status}. ${body}`, true);
      } catch (error) {
        return text(`Could not fetch the rule: ${message(error)}`, true);
      }
    },
  });

  register(context, signal, {
    name: "scan_dependencies",
    description:
      "Check a package.json, or a public owner/repo, against the catalog. A successful scan opens the report in this tab. Nothing is stored: the report lives in the URL.",
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
      try {
        const result = await deps.scan(input);
        if (result?.error) return text(result.error, true);
        // No error means the action redirected to the report. This does not
        // confirm the page finished loading it.
        return text("Scan submitted. The report is opening in this tab.");
      } catch (error) {
        return text(`The scan failed: ${message(error)}`, true);
      }
    },
  });
}
