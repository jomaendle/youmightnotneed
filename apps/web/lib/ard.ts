import { site } from "./site.ts";

/**
 * The Agentic Resource Discovery manifest, https://agenticresourcediscovery.org/spec.
 *
 * An entry needs `identifier` (`urn:air:<publisher>:<namespace>:<name>`, where
 * the publisher is the domain serving the manifest), `displayName`, `type` and
 * exactly one of `url` or `data`. `type` is an IANA media type, so llms.txt is
 * `text/markdown`. The url-or-data rule is in the type below, and ard.test.ts
 * checks the rest.
 */
interface ArdBase {
  identifier: string;
  displayName: string;
  type: string;
  description: string;
  representativeQueries: string[];
  capabilities: string[];
}

type ArdEntry =
  | (ArdBase & { url: string; data?: never })
  | (ArdBase & { data: unknown; url?: never });

export interface ArdManifest {
  entries: ArdEntry[];
}

const id = (namespace: string, name: string) =>
  `urn:air:${site.domain}:${namespace}:${name}`;

const SKILL_ARCHIVE_PATH = "/.well-known/agent-skills/youmightnotneed.tar.gz";

export function buildArd(): ArdManifest {
  return {
    entries: [
      {
        identifier: id("docs", "llms-txt"),
        displayName: "youmightnotneed index",
        type: "text/markdown",
        url: `${site.url}/llms.txt`,
        description:
          "Every rule by use case, plus how to fetch one rule as markdown.",
        representativeQueries: [
          "can this npm package be replaced by a native browser feature",
          "what does the platform do instead of a date picker library",
        ],
        capabilities: ["rule-index"],
      },
      {
        identifier: id("api", "openapi"),
        displayName: "youmightnotneed read-only API",
        type: "application/vnd.oai.openapi+json",
        url: `${site.url}/openapi.json`,
        description:
          "OpenAPI description of the read-only endpoints. No authentication.",
        representativeQueries: [
          "fetch the native replacement rule for a package",
        ],
        capabilities: ["getIndex", "getFullCatalog", "getRule"],
      },
      {
        identifier: id("server", "mcp"),
        displayName: "youmightnotneed MCP server",
        // Deliberately not application/mcp-server-card+json: that names a
        // schema this entry does not implement. The data is the same stdio
        // launch spec the plugin's .mcp.json uses.
        type: "application/json",
        data: {
          transport: "stdio",
          command: "npx",
          args: ["-y", "youmightnotneed-mcp"],
        },
        description:
          "Runs locally over stdio. Matches a package.json against the catalog and sends nothing anywhere.",
        representativeQueries: [
          "which of my dependencies does the platform now cover",
        ],
        capabilities: ["analyze_dependencies", "list_rules", "get_rule"],
      },
      {
        identifier: id("skill", "youmightnotneed"),
        displayName: "youmightnotneed agent skill",
        type: "application/gzip",
        url: `${site.url}${SKILL_ARCHIVE_PATH}`,
        description:
          "SKILL.md and its references, for agents checking dependencies in someone else's codebase.",
        representativeQueries: [
          "review my package.json for dependencies I no longer need",
        ],
        capabilities: ["dependency-review"],
      },
    ],
  };
}
