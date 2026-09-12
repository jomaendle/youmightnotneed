#!/usr/bin/env node
/**
 * npx youmightnotneed-mcp
 *
 * Starts the MCP server over stdio. All process-level I/O (the stdio
 * transport) lives here; server.ts additionally reads this package's own
 * version from package.json. Tool logic in tools.ts stays pure and
 * server.ts's tool registration stays a thin adapter.
 */
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.ts";

/**
 * Says what is happening when someone runs this by hand.
 *
 * A stdio server with no client attached blocks on stdin and prints nothing,
 * which is correct and looks exactly like a hang. Someone typing
 * `npx youmightnotneed-mcp` to see what it does gets a silent cursor and
 * reasonably concludes it crashed.
 *
 * stdout is the protocol channel and writing to it would corrupt the stream,
 * so this goes to stderr, which clients log rather than parse. Gated on
 * stdin being a TTY, so a real client never sees it: when a client is
 * attached, stdin is a pipe.
 *
 * The server still starts either way. A TTY is strong evidence that nobody
 * is going to speak JSON-RPC, but exiting on it would break the one person
 * driving the server by hand for a reason.
 */
function hintWhenInteractive(): void {
  if (!process.stdin.isTTY) return;
  process.stderr.write(
    "youmightnotneed-mcp is running. It speaks MCP over stdio, so it waits " +
      "for a client and prints nothing here.\n" +
      "Register it instead of running it directly:\n" +
      "  claude mcp add youmightnotneed -- npx -y youmightnotneed-mcp\n" +
      "Setup for other clients: https://youmightnotneed.dev\n" +
      "Press Ctrl+C to stop.\n",
  );
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // After connect, so a failure to start is not preceded by a line saying
  // it started.
  hintWhenInteractive();
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
