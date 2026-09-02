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
 * `notifications/initialized` notification), sends one more request (the
 * `extraRequest` passed in), and resolves once both id: 1 and id: 2
 * responses have arrived on stdout.
 *
 * The `init` response proves main() actually ran and connected the stdio
 * transport at all. This is the regression this file exists to catch: see
 * packages/cli/src/bin.ts's history.
 */

type ParsedLine =
  | { ok: true; message: JsonRpcResponse }
  | { ok: false; error: Error };

/**
 * Pulls every complete (newline-terminated) line out of `buffer`, leaving
 * a trailing partial line, if any, for the next chunk to complete.
 */
function splitCompleteLines(buffer: string): {
  lines: string[];
  remainder: string;
} {
  const lines: string[] = [];
  let rest = buffer;
  let newlineIndex = rest.indexOf("\n");
  while (newlineIndex !== -1) {
    lines.push(rest.slice(0, newlineIndex));
    rest = rest.slice(newlineIndex + 1);
    newlineIndex = rest.indexOf("\n");
  }
  return { lines, remainder: rest };
}

/**
 * Parses one line of stdout as a JSON-RPC message. Returns a tagged
 * result instead of throwing, so the `data` callback that calls this can
 * stay a simple loop with no try/catch of its own.
 */
function parseJsonRpcLine(line: string): ParsedLine {
  try {
    return { ok: true, message: JSON.parse(line) as JsonRpcResponse };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

type LineResult =
  | { kind: "continue" }
  | { kind: "error"; error: Error }
  | { kind: "done" };

/**
 * Parses one line and, if it is a valid JSON-RPC message with an id,
 * records it in `responses`. Reports whether the caller should keep
 * reading lines, stop because parsing failed, or stop because both
 * expected responses are now in hand.
 */
function processLine(line: string, responses: JsonRpcResponse[]): LineResult {
  const parsed = parseJsonRpcLine(line);
  if (!parsed.ok) return { kind: "error", error: parsed.error };
  if (parsed.message.id !== undefined) responses.push(parsed.message);
  return responses.length === 2 ? { kind: "done" } : { kind: "continue" };
}

/**
 * Settles the callThrough promise once both id: 1 and id: 2 responses are
 * in hand: resolves with both, or rejects if one of the two ids never
 * showed up among the two responses collected.
 */
function settleWithResponses(
  responses: JsonRpcResponse[],
  resolvePromise: (result: CallThroughResult) => void,
  reject: (error: Error) => void,
): void {
  const init = responses.find((r) => r.id === 1);
  const extra = responses.find((r) => r.id === 2);
  if (!(init && extra)) {
    reject(new Error("missing expected id: 1 or id: 2 response"));
    return;
  }
  resolvePromise({ init, extra });
}

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
    let stderrBuffer = "";

    const timeout = setTimeout(() => {
      child.kill();
      reject(
        new Error(`timed out waiting for responses. stderr: ${stderrBuffer}`),
      );
    }, 4000);

    child.stderr.on("data", (chunk: Buffer) => {
      stderrBuffer += chunk.toString("utf8");
    });

    child.stdout.on("data", (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const { lines, remainder } = splitCompleteLines(buffer);
      buffer = remainder;

      for (const line of lines) {
        const result = processLine(line, responses);
        if (result.kind === "continue") continue;

        clearTimeout(timeout);
        child.kill();
        if (result.kind === "error") {
          reject(new Error(`${result.error.message}. stderr: ${stderrBuffer}`));
          return;
        }
        settleWithResponses(responses, resolvePromise, reject);
        return;
      }
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

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

// Together with the two tests above, these prove that server.ts's
// registerTool calls route each of the three tool names to the intended
// handler rather than to a copy-pasted wrong one: tools/list proves all
// three tools are registered under their own names, and get_rule below
// proves the id/package precedence in its handler.
describe("tool routing", () => {
  it("lists all three registered tools by name", async () => {
    const { extra } = await callThrough(binPath, { method: "tools/list" });
    const response = extra as {
      result?: { tools?: Array<{ name?: string }> };
    };
    const names = response.result?.tools?.map((tool) => tool.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "analyze_dependencies",
        "list_rules",
        "get_rule",
      ]),
    );
    expect(names).toHaveLength(3);
  });

  it("routes get_rule to id over package when both are given", async () => {
    const { extra } = await callThrough(binPath, {
      method: "tools/call",
      params: {
        name: "get_rule",
        arguments: { id: "css-masonry", package: "left-pad" },
      },
    });
    const response = extra as {
      result?: { structuredContent?: { rule?: { id?: string } } };
    };
    expect(response.result?.structuredContent?.rule?.id).toBe("css-masonry");
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
