/*
 * The published versions of the surfaces this site points people at.
 *
 * Read from the workspace manifests rather than written down, for the same
 * reason no browser version in this repo is typed by hand: changesets bumps
 * those files on release, and a number copied into JSX goes stale without
 * anything failing.
 *
 * Imported by package name, not by a relative path across the workspace.
 * Both are declared as devDependencies of this app, so the build graph knows
 * the site depends on them. A relative `../../../packages/cli/package.json`
 * resolves today but is invisible to pnpm, which means nothing would tell you
 * the site had broken if either package moved.
 *
 * Resolved at build time, so nothing reads the filesystem at runtime. Keep
 * these imports out of any "use client" module: the whole manifest is
 * inlined, and that would ship this repo's devDependencies to browsers.
 */
import cliManifest from "youmightnotneed/package.json" with { type: "json" };
import mcpManifest from "youmightnotneed-mcp/package.json" with {
  type: "json",
};

export const CLI_VERSION: string = cliManifest.version;
export const MCP_VERSION: string = mcpManifest.version;
