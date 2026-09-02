import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const binPath = resolve(import.meta.dirname, "bin.ts");

// Creating a symlink needs no special privilege on POSIX, but does on
// Windows without Developer Mode or an elevated shell. Probed once at
// module load so the symlink describe block below can skip cleanly there.
const canSymlink = (() => {
  const probeDir = mkdtempSync(
    join(tmpdir(), "youmightnotneed-mcp-symlink-probe-"),
  );
  try {
    symlinkSync(join(probeDir, "target"), join(probeDir, "link"));
    return true;
  } catch {
    return false;
  } finally {
    rmSync(probeDir, { recursive: true, force: true });
  }
})();

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "youmightnotneed-mcp-test-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

interface JsonRpcResponse {
  id?: number;
  result?: unknown;
}

interface CallThroughResult {
  /** Response to the id: 1 `initialize` request. */
  init: JsonRpcResponse;
  /** Response to the id: 2 request passed as `extraRequest`. */
  extra: JsonRpcResponse;
}

/**
 * Spawns `command`, performs a full MCP handshake (initialize, then the
 * `notifications/initialized` notification), sends one more request, and
 * resolves once both id: 1 and id: 2 responses have arrived on stdout.
 *
 * Proves two different things depending on which test uses it: that
 * main() actually ran and connected the stdio transport at all (the
 * regression this file exists to catch — see packages/cli/src/bin.ts's
 * history), and separately, via the `extra` response, that server.ts's
 * registerTool calls actually route each tool name to the intended
 * handler rather than to a copy-pasted wrong one.
 */
function callThrough(
  command: string,
  extraRequest: { method: string; params?: unknown },
): Promise<CallThroughResult> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [command], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let buffer = "";
    const responses: JsonRpcResponse[] = [];

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("timed out waiting for responses"));
    }, 10_000);

    child.stdout.on("data", (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        newlineIndex = buffer.indexOf("\n");

        let message: JsonRpcResponse;
        try {
          message = JSON.parse(line) as JsonRpcResponse;
        } catch (error) {
          clearTimeout(timeout);
          child.kill();
          reject(error as Error);
          return;
        }
        if (message.id !== undefined) responses.push(message);

        if (responses.length === 2) {
          clearTimeout(timeout);
          child.kill();
          const init = responses.find((r) => r.id === 1);
          const extra = responses.find((r) => r.id === 2);
          if (!init || !extra) {
            reject(new Error("missing expected id: 1 or id: 2 response"));
            return;
          }
          resolvePromise({ init, extra });
          return;
        }
      }
    });

    child.on("error", reject);

    child.stdin.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test-client", version: "0.0.0" },
        },
      })}\n`,
    );
    child.stdin.write(
      `${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`,
    );
    child.stdin.write(
      `${JSON.stringify({ jsonrpc: "2.0", id: 2, ...extraRequest })}\n`,
    );
  });
}

const analyzeMasonryRequest = {
  method: "tools/call",
  params: {
    name: "analyze_dependencies",
    arguments: { dependencies: { "react-masonry-css": "^1.0.0" } },
  },
};

interface AnalyzeToolResponse {
  result?: {
    structuredContent?: { findings?: Array<{ rule?: { id?: string } }> };
  };
}

describe("entry point detection via direct invocation", () => {
  it("starts the server and responds to initialize when invoked directly", async () => {
    const { init } = await callThrough(binPath, analyzeMasonryRequest);
    expect(
      (init.result as { serverInfo?: { name?: string } } | undefined)
        ?.serverInfo?.name,
    ).toBe("youmightnotneed-mcp");
  });

  it("routes analyze_dependencies to the actual catalog handler when invoked directly", async () => {
    const { extra } = await callThrough(binPath, analyzeMasonryRequest);
    const response = extra as AnalyzeToolResponse;
    expect(response.result?.structuredContent?.findings?.[0]?.rule?.id).toBe(
      "css-masonry",
    );
  });
});

describe.skipIf(!canSymlink)("entry point detection through a symlink", () => {
  it("starts the server and routes tools correctly through a node_modules/.bin-style symlink", async () => {
    const link = join(dir, "youmightnotneed-mcp");
    symlinkSync(binPath, link);

    const { init, extra } = await callThrough(link, analyzeMasonryRequest);
    expect(
      (init.result as { serverInfo?: { name?: string } } | undefined)
        ?.serverInfo?.name,
    ).toBe("youmightnotneed-mcp");
    const response = extra as AnalyzeToolResponse;
    expect(response.result?.structuredContent?.findings?.[0]?.rule?.id).toBe(
      "css-masonry",
    );
  });
});
