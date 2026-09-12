/*
 * The published versions of the surfaces this site points people at.
 *
 * Imported from the workspace manifests rather than written down, for the
 * same reason no browser version in this repo is typed by hand: changesets
 * bumps those files on release, and a number copied into JSX goes stale
 * without anything failing. The import is resolved at build time, so nothing
 * reads the filesystem at runtime.
 */

import cliManifest from "../../../packages/cli/package.json" with {
  type: "json",
};
import mcpManifest from "../../../packages/mcp/package.json" with {
  type: "json",
};

export const CLI_VERSION: string = cliManifest.version;
export const MCP_VERSION: string = mcpManifest.version;
