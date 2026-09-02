import { readFileSync } from "node:fs";
import type { PackageJsonLike } from "@jomae/catalog";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  analyzeDependencies,
  type GetRuleResult,
  getRule,
  listRules,
} from "./tools.ts";

/** Wraps a getRule() result in the { content, structuredContent } shape every tool handler returns. */
function toolResponse(result: GetRuleResult) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    structuredContent: result as unknown as Record<string, unknown>,
  };
}

function readOwnVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "youmightnotneed-mcp",
    version: readOwnVersion(),
  });

  server.registerTool(
    "analyze_dependencies",
    {
      title: "Analyze dependencies",
      description:
        "Matches a package.json's dependencies against the youmightnotneed catalog. Returns findings (a matched rule per dependency with a native replacement), a summary, and provenance for when the underlying data was captured. Every finding is conditional: read the rule's agent.unless conditions before suggesting a removal.",
      inputSchema: {
        dependencies: z.record(z.string(), z.string()).optional(),
        devDependencies: z.record(z.string(), z.string()).optional(),
        peerDependencies: z.record(z.string(), z.string()).optional(),
      },
    },
    (input: PackageJsonLike) => {
      const result = analyzeDependencies(input);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
        structuredContent: result as unknown as Record<string, unknown>,
      };
    },
  );

  server.registerTool(
    "list_rules",
    {
      title: "List rules",
      description:
        "Lists every rule in the youmightnotneed catalog: id, title, the npm packages it replaces, and the native approach in one line. Use get_rule for full detail on one rule.",
      inputSchema: {},
    },
    () => {
      const result = listRules();
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
        structuredContent: result as unknown as Record<string, unknown>,
      };
    },
  );

  server.registerTool(
    "get_rule",
    {
      title: "Get rule",
      description:
        "Looks up one catalog rule by its id or by an npm package name it replaces. Returns the full explainer, code snippet, agent.unless conditions, and resolved Baseline support status. Returns { found: false } rather than an error when nothing matches. If both id and package are given, id wins.",
      inputSchema: {
        id: z.string().optional(),
        package: z.string().optional(),
      },
    },
    (input: { id?: string; package?: string }) => {
      if (input.id !== undefined) {
        return toolResponse(getRule({ id: input.id }));
      }
      if (input.package !== undefined) {
        return toolResponse(getRule({ package: input.package }));
      }
      return {
        content: [
          {
            type: "text" as const,
            text: "Provide either id or package.",
          },
        ],
        isError: true,
      };
    },
  );

  return server;
}
