#!/usr/bin/env node
/**
 * npx youmightnotneed-mcp
 *
 * Starts the MCP server over stdio. All I/O (reading this package's own
 * version, the stdio transport) lives here; tool logic in tools.ts stays
 * pure and server.ts's tool registration stays a thin adapter.
 */
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.ts";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Only run as a side effect when this file is the process entry point, not
// when a test imports createServer() from server.ts directly. npm/npx
// invoke a package's bin through a node_modules/.bin symlink, and
// import.meta.url reports that symlink dereferenced while argv[1] does not.
// packages/cli/src/bin.ts had this same bug this session, fixed here from
// the start with the same realpathSync() + pathToFileURL() approach.
function isEntryPoint(): boolean {
  const argv1 = process.argv[1];
  if (argv1 === undefined) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(argv1)).href;
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
