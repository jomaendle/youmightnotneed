# MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `packages/mcp`, a new npm package published as `youmightnotneed-mcp`, exposing the `@jomae/catalog` rule catalog to any MCP-capable agent as three tools: `analyze_dependencies`, `list_rules`, `get_rule`.

**Architecture:** A pure `tools.ts` (three handler functions, no MCP SDK import, fully unit-testable) wrapped by a thin `server.ts` adapter (constructs `McpServer`, registers the three tools with zod input schemas) and a `bin.ts` entry point (stdio transport, the same symlink-safe entry-point guard `packages/cli/src/bin.ts` uses).

**Tech Stack:** TypeScript 7 strict (repo's `tsconfig.base.json`), `@modelcontextprotocol/sdk@^1.30.0`, `zod@^4` (already a `@jomae/catalog` dependency), vitest, pnpm workspaces.

**Spec:** `docs/superpowers/specs/2026-09-02-mcp-server-design.md`

## Global Constraints

- Node `>=22.18.0` (matches `packages/cli`/`packages/catalog`).
- `type: "module"` everywhere. Relative imports use the `.ts` extension in source (`rewriteRelativeImportExtensions` rewrites to `.js` on emit). Never write a bare `.js` import in source.
- No em dashes or banned vocabulary in any user-visible text (tool `description` strings, README, CLAUDE.md). `node scripts/check-copy.ts` enforces this at the repo root; load `.claude/skills/writing-voice/SKILL.md` before writing any of it.
- `tools.ts` stays pure: it may only import from `@jomae/catalog` and use no I/O. All filesystem/process/network access lives in `server.ts` (reading the package's own version) or `bin.ts` (the transport).
- Data is static (the committed `@jomae/catalog` snapshot). No network calls anywhere in this package. That was an explicit non-goal in the spec.
- `pnpm verify` (lint, typecheck, `test:coverage`, `knip`, `check:freshness`, `check:copy`) must pass at the repo root after every task that touches source, not just at the end.

---

### Task 1: Scaffold the package and implement `analyze_dependencies`

**Files:**
- Create: `packages/mcp/package.json`
- Create: `packages/mcp/tsconfig.json`
- Create: `packages/mcp/tsconfig.build.json`
- Create: `packages/mcp/src/tools.ts`
- Create: `packages/mcp/src/tools.test.ts`
- Modify: `knip.json:1-19` (add a `packages/mcp` workspace entry)

**Interfaces:**
- Produces: `analyzeDependencies(input: PackageJsonLike): AnalyzeDependenciesResult` where `AnalyzeDependenciesResult` is `Report & { provenance: { baselineOn: string; webFeaturesVersion: string; sizesOn: string } }`. Tasks 2 and 4 add to the same file; Task 4 imports this function by name.

- [ ] **Step 1: Create the package manifest**

`packages/mcp/package.json`:

```json
{
  "name": "youmightnotneed-mcp",
  "version": "0.1.0",
  "type": "module",
  "description": "MCP server exposing the youmightnotneed rule catalog to AI agents.",
  "license": "MIT",
  "author": "Johannes Maendle",
  "homepage": "https://youmightnotneed-web.vercel.app",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/jomaendle/youmightnotneed.git",
    "directory": "packages/mcp"
  },
  "keywords": [
    "mcp",
    "model-context-protocol",
    "css",
    "baseline",
    "agent"
  ],
  "bin": {
    "youmightnotneed-mcp": "./dist/bin.js"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "start": "node src/bin.ts",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "@jomae/catalog": "workspace:*",
    "@modelcontextprotocol/sdk": "^1.30.0",
    "zod": "^4.5.4"
  },
  "engines": {
    "node": ">=22.18.0"
  },
  "devDependencies": {
    "vitest": "^4.1.11",
    "@types/node": "^24.13.3",
    "@vitest/coverage-v8": "^4.1.11"
  }
}
```

`packages/mcp/tsconfig.json` (identical shape to `packages/cli/tsconfig.json`):

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"]
}
```

`packages/mcp/tsconfig.build.json` (identical shape to `packages/cli/tsconfig.build.json`):

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["src/**/*.test.ts"]
}
```

- [ ] **Step 2: Add the knip workspace entry**

In `knip.json`, add a `"packages/mcp"` entry alongside the existing `"packages/cli"` one (same shape):

```json
    "packages/mcp": {
      "entry": ["src/**/*.test.ts"],
      "project": ["src/**/*.ts"]
    },
```

Insert it after the `"packages/cli"` block (before `"apps/web"`), so the full `workspaces` object reads:

```json
  "workspaces": {
    ".": {
      "entry": ["scripts/*.ts"],
      "project": ["scripts/**/*.ts"]
    },
    "packages/catalog": {
      "entry": ["src/**/*.test.ts"],
      "project": ["src/**/*.ts"],
      "ignore": ["src/generated/**"]
    },
    "packages/cli": {
      "entry": ["src/**/*.test.ts"],
      "project": ["src/**/*.ts"]
    },
    "packages/mcp": {
      "entry": ["src/**/*.test.ts"],
      "project": ["src/**/*.ts"]
    },
    "apps/web": {
      "entry": ["app/**/{page,layout,route,not-found,error,loading}.{ts,tsx}"],
      "project": ["**/*.{ts,tsx}"]
    }
  },
```

- [ ] **Step 3: Install dependencies**

Run: `pnpm install`
Expected: pnpm resolves `@modelcontextprotocol/sdk`, `zod`, `@jomae/catalog` (workspace link) into `packages/mcp/node_modules`, and `pnpm-lock.yaml` updates. No errors.

- [ ] **Step 4: Write the failing test for `analyzeDependencies`**

`packages/mcp/src/tools.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { analyzeDependencies } from "./tools.ts";

describe("analyzeDependencies", () => {
  it("matches a known dependency and returns provenance", () => {
    const result = analyzeDependencies({
      dependencies: { "react-masonry-css": "^1.0.0" },
    });

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.rule.id).toBe("css-masonry");
    expect(result.summary.findingCount).toBe(1);
    expect(result.provenance.baselineOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.provenance.webFeaturesVersion).toBeTruthy();
    expect(result.provenance.sizesOn).toBeTruthy();
  });

  it("returns no findings for an unmatched dependency", () => {
    const result = analyzeDependencies({
      dependencies: { "totally-unrelated-package": "^1.0.0" },
    });

    expect(result.findings).toHaveLength(0);
    expect(result.summary.findingCount).toBe(0);
  });

  it("treats a missing dependency field as empty", () => {
    const result = analyzeDependencies({});
    expect(result.findings).toHaveLength(0);
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `pnpm --filter youmightnotneed-mcp test`
Expected: FAIL. `tools.ts` does not exist yet (module not found).

- [ ] **Step 6: Implement `analyzeDependencies`**

`packages/mcp/src/tools.ts`:

```ts
import {
  analyze,
  BASELINE_DATA_DATE,
  packageSizes,
  type PackageJsonLike,
  type Report,
  WEB_FEATURES_VERSION,
} from "@jomae/catalog";

export interface Provenance {
  baselineOn: string;
  webFeaturesVersion: string;
  sizesOn: string;
}

export interface AnalyzeDependenciesResult extends Report {
  provenance: Provenance;
}

/**
 * Matches a package.json's dependency fields against the catalog. Pure:
 * calls straight into @jomae/catalog's analyze(), no filesystem or network.
 */
export function analyzeDependencies(
  input: PackageJsonLike,
): AnalyzeDependenciesResult {
  const report = analyze(input);
  return {
    ...report,
    provenance: {
      baselineOn: BASELINE_DATA_DATE,
      webFeaturesVersion: WEB_FEATURES_VERSION,
      sizesOn: packageSizes.fetchedOn,
    },
  };
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm --filter youmightnotneed-mcp test`
Expected: PASS, 3 tests.

- [ ] **Step 8: Typecheck**

Run: `pnpm --filter youmightnotneed-mcp typecheck`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add packages/mcp/package.json packages/mcp/tsconfig.json packages/mcp/tsconfig.build.json packages/mcp/src/tools.ts packages/mcp/src/tools.test.ts knip.json pnpm-lock.yaml
git commit -m "feat: scaffold packages/mcp, add analyze_dependencies handler"
```

---

### Task 2: `list_rules` handler

**Files:**
- Modify: `packages/mcp/src/tools.ts`
- Modify: `packages/mcp/src/tools.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1's function; imports `rules` from `@jomae/catalog` directly.
- Produces: `listRules(): { rules: RuleSummary[] }` where `RuleSummary` is `{ id: string; title: string; replaces: string[]; native: string }`. Task 4 imports this by name.

- [ ] **Step 1: Add the failing test**

Append to `packages/mcp/src/tools.test.ts`:

```ts
import { listRules } from "./tools.ts";
```

(add `listRules` to the existing `import { analyzeDependencies } from "./tools.ts";` line instead of a new import line. The final import line reads `import { analyzeDependencies, listRules } from "./tools.ts";`)

```ts
describe("listRules", () => {
  it("lists every rule with id, title, replaces, and native", () => {
    const { rules } = listRules();

    expect(rules.length).toBeGreaterThan(0);
    const masonryEntry = rules.find((rule) => rule.id === "css-masonry");
    expect(masonryEntry).toEqual({
      id: "css-masonry",
      title: "Masonry layouts",
      replaces: expect.arrayContaining(["react-masonry-css"]),
      native: "CSS masonry item placement",
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter youmightnotneed-mcp test`
Expected: FAIL. `listRules` is not exported.

- [ ] **Step 3: Implement `listRules`**

Add to `packages/mcp/src/tools.ts` (add `rules` to the existing `@jomae/catalog` import):

```ts
import {
  analyze,
  BASELINE_DATA_DATE,
  packageSizes,
  type PackageJsonLike,
  type Report,
  rules,
  WEB_FEATURES_VERSION,
} from "@jomae/catalog";
```

```ts
export interface RuleSummary {
  id: string;
  title: string;
  replaces: string[];
  native: string;
}

/** Every rule, four fields each. Pure. Use getRule() for full detail. */
export function listRules(): { rules: RuleSummary[] } {
  return {
    rules: rules.map((rule) => ({
      id: rule.id,
      title: rule.title,
      replaces: rule.replaces,
      native: rule.native,
    })),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter youmightnotneed-mcp test`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/mcp/src/tools.ts packages/mcp/src/tools.test.ts
git commit -m "feat: add list_rules handler"
```

---

### Task 3: `get_rule` handler

**Files:**
- Modify: `packages/mcp/src/tools.ts`
- Modify: `packages/mcp/src/tools.test.ts`

**Interfaces:**
- Consumes: `rulesById: ReadonlyMap<string, Rule>` and `rulesByPackage: ReadonlyMap<string, Rule>` from `@jomae/catalog`, and `resolveBaseline(rule: Rule): BaselineInfo`.
- Produces: `getRule(input: GetRuleInput): GetRuleResult` where `GetRuleInput = { id: string } | { package: string }` and `GetRuleResult = { found: true; rule: Rule; baseline: BaselineInfo } | { found: false }`. Task 4 imports this by name and is responsible for resolving a flat `{ id?, package? }` tool input into this union (see Task 4).

- [ ] **Step 1: Add the failing test**

Update the `tools.ts` import line in `packages/mcp/src/tools.test.ts` to `import { analyzeDependencies, getRule, listRules } from "./tools.ts";`, then append:

```ts
describe("getRule", () => {
  it("finds a rule by id", () => {
    const result = getRule({ id: "css-masonry" });

    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.rule.id).toBe("css-masonry");
      expect(result.baseline.status).toBeDefined();
    }
  });

  it("finds a rule by package name", () => {
    const result = getRule({ package: "react-masonry-css" });

    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.rule.id).toBe("css-masonry");
    }
  });

  it("returns found: false for an unknown id", () => {
    expect(getRule({ id: "does-not-exist" })).toEqual({ found: false });
  });

  it("returns found: false for an unknown package", () => {
    expect(getRule({ package: "left-pad" })).toEqual({ found: false });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter youmightnotneed-mcp test`
Expected: FAIL. `getRule` is not exported.

- [ ] **Step 3: Implement `getRule`**

Add to `packages/mcp/src/tools.ts` (extend the `@jomae/catalog` import to include `type BaselineInfo`, `resolveBaseline`, `type Rule`, `rulesById`, `rulesByPackage`):

```ts
import {
  analyze,
  BASELINE_DATA_DATE,
  type BaselineInfo,
  packageSizes,
  type PackageJsonLike,
  type Report,
  resolveBaseline,
  type Rule,
  rules,
  rulesById,
  rulesByPackage,
  WEB_FEATURES_VERSION,
} from "@jomae/catalog";
```

```ts
export type GetRuleInput = { id: string } | { package: string };

export type GetRuleResult =
  | { found: true; rule: Rule; baseline: BaselineInfo }
  | { found: false };

/**
 * Looks up one rule by its id or by an npm package name it replaces. Pure.
 * Returns { found: false } rather than throwing, matching
 * resolveFeature()'s no-throw-on-unknown-input behavior elsewhere in the
 * catalog.
 */
export function getRule(input: GetRuleInput): GetRuleResult {
  const rule =
    "id" in input
      ? rulesById.get(input.id)
      : rulesByPackage.get(input.package);

  if (!rule) return { found: false };
  return { found: true, rule, baseline: resolveBaseline(rule) };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter youmightnotneed-mcp test`
Expected: PASS, 8 tests.

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter youmightnotneed-mcp typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/mcp/src/tools.ts packages/mcp/src/tools.test.ts
git commit -m "feat: add get_rule handler"
```

---

### Task 4: MCP server adapter

**Files:**
- Create: `packages/mcp/src/server.ts`

**Interfaces:**
- Consumes: `analyzeDependencies`, `listRules`, `getRule` from `./tools.ts` (Tasks 1-3), and `PackageJsonLike` from `@jomae/catalog`.
- Produces: `createServer(): McpServer`. Task 5's `bin.ts` imports this by name.

This task has no dedicated unit tests of its own. Per the spec, `server.ts`'s tool registration is thin enough that `tools.ts`'s tests already cover the logic. Task 5's regression test (spawning the real process and sending a live `initialize` request) is what proves the wiring in this file actually works end to end.

Note on the spec's error-handling requirement ("one bad call shouldn't take down the stdio connection"): verified directly against the installed `@modelcontextprotocol/sdk@1.30.0` source (`dist/esm/server/mcp.js`) that `McpServer` already wraps every tool callback in try/catch internally and converts a thrown error into a `CallToolResult` with `isError: true` via its own `createToolError()`. No additional try/catch is needed in this file for that requirement: it is already satisfied by the SDK.

- [ ] **Step 1: Implement `server.ts`**

`packages/mcp/src/server.ts`:

```ts
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PackageJsonLike } from "@jomae/catalog";
import { z } from "zod";
import { analyzeDependencies, getRule, listRules } from "./tools.ts";

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
    async (input: PackageJsonLike) => {
      const result = analyzeDependencies(input);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
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
    async () => {
      const result = listRules();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
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
    async (input: { id?: string; package?: string }) => {
      if (input.id === undefined && input.package === undefined) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Provide either id or package.",
            },
          ],
          isError: true,
        };
      }

      const result = getRule(
        input.id !== undefined ? { id: input.id } : { package: input.package as string },
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    },
  );

  return server;
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter youmightnotneed-mcp typecheck`
Expected: no errors. If `structuredContent` complains about a type mismatch (its declared type is `Record<string, unknown>` and `AnalyzeDependenciesResult`/`GetRuleResult` are interfaces/unions, not index signatures), cast at the call site: `structuredContent: result as unknown as Record<string, unknown>`. Apply the same cast to all three `structuredContent` lines if needed. Do not change `tools.ts`'s return types to accommodate this; the cast belongs in the adapter layer, not the pure layer.

- [ ] **Step 3: Commit**

```bash
git add packages/mcp/src/server.ts
git commit -m "feat: wire the three tools into an MCP server"
```

---

### Task 5: Entry point and symlink regression test

**Files:**
- Create: `packages/mcp/src/bin.ts`
- Create: `packages/mcp/src/bin.test.ts`

**Interfaces:**
- Consumes: `createServer` from `./server.ts` (Task 4).
- Produces: the package's `bin` executable (`dist/bin.js` once built).

- [ ] **Step 1: Implement `bin.ts`**

`packages/mcp/src/bin.ts`:

```ts
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
// import.meta.url reports that symlink dereferenced while argv[1] does
// not. Same bug packages/cli/src/bin.ts had this session, fixed here
// from the start with the same realpathSync() + pathToFileURL() approach.
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
```

- [ ] **Step 2: Write the failing regression test**

`packages/mcp/src/bin.test.ts`:

```ts
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
 * Proves two different things depending on which test uses it. First,
 * that main() actually ran and connected the stdio transport at all (see
 * packages/cli/src/bin.ts's history for the regression this file exists
 * to catch). Second, via the `extra` response, that server.ts's
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
```

- [ ] **Step 3: Run the tests to verify they pass**

Run: `pnpm --filter youmightnotneed-mcp test`
Expected: PASS, 11 tests total (8 from `tools.test.ts` + 3 from `bin.test.ts`). These are not "failing then passing" in the usual TDD sense since `bin.ts` and the test were written together, but the run must be observed and confirmed green before moving on, same as every other step.

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter youmightnotneed-mcp typecheck`
Expected: no errors.

- [ ] **Step 5: Manual smoke test with the real MCP inspector (optional but recommended)**

Run: `npx @modelcontextprotocol/inspector node packages/mcp/src/bin.ts`
Expected: the inspector UI opens in a browser, lists all three tools, and calling `analyze_dependencies` with `{"dependencies": {"react-masonry-css": "1.0.0"}}` returns a finding for `css-masonry`. This is the closest thing to testing against a real MCP client without adding one as a dependency.

- [ ] **Step 6: Commit**

```bash
git add packages/mcp/src/bin.ts packages/mcp/src/bin.test.ts
git commit -m "feat: add MCP server entry point with symlink regression test"
```

---

### Task 6: Build, docs, and release prep

**Files:**
- Modify: `CLAUDE.md:29-36` (Layout), `CLAUDE.md:58-61` (Not building)
- Modify: `README.md:52-59` (Layout)
- Create: `packages/mcp/README.md`

**Interfaces:** none. This task only touches documentation and build output.

- [ ] **Step 1: Build the package**

Run: `pnpm --filter youmightnotneed-mcp build`
Expected: `packages/mcp/dist/bin.js`, `dist/server.js`, `dist/tools.js` (plus `.d.ts`/`.map` files) are created. No errors.

- [ ] **Step 2: Update `CLAUDE.md`'s Layout section**

In `CLAUDE.md`, change:

```
packages/catalog   the rules, schema, baseline resolution, detect()
packages/cli       npx youmightnotneed
apps/web           youmightnotneed.dev
scripts            snapshot generators, freshness check
```

to:

```
packages/catalog   the rules, schema, baseline resolution, detect()
packages/cli       npx youmightnotneed
packages/mcp       npx youmightnotneed-mcp
apps/web           youmightnotneed.dev
scripts            snapshot generators, freshness check
```

- [ ] **Step 3: Update `CLAUDE.md`'s Not building section**

Change:

```
## Not building

VS Code extension, hosted playground, accounts, auth. The MCP server and the
`modern-css` skill are Launch 2, and only if Launch 1 lands.
```

to:

```
## Not building

VS Code extension, hosted playground, accounts, auth. The `modern-css`
skill is Launch 2, and only if Launch 1 lands.
```

- [ ] **Step 4: Update root `README.md`'s Layout section**

In `README.md`, change:

```
packages/catalog   @jomae/catalog, MIT, published to npm
packages/cli       npx youmightnotneed
apps/web           youmightnotneed.dev
scripts            snapshot generators and the freshness check
```

to:

```
packages/catalog   @jomae/catalog, MIT, published to npm
packages/cli       npx youmightnotneed
packages/mcp       npx youmightnotneed-mcp, an MCP server for agents
apps/web           youmightnotneed.dev
scripts            snapshot generators and the freshness check
```

- [ ] **Step 5: Write the package README**

`packages/mcp/README.md`:

```markdown
# youmightnotneed-mcp

An MCP server that gives an agent direct access to the youmightnotneed rule
catalog: whether a dependency already has a native replacement, and what
that replacement looks like.

Add it to an MCP client's config:

\`\`\`json
{
  "mcpServers": {
    "youmightnotneed": {
      "command": "npx",
      "args": ["youmightnotneed-mcp"]
    }
  }
}
\`\`\`

## Tools

- `analyze_dependencies`: matches a package.json's `dependencies`,
  `devDependencies` and `peerDependencies` against the catalog. Returns
  findings, a summary, and provenance for when the underlying data was
  captured.
- `list_rules`: every rule's id, title, the npm packages it replaces, and
  the native approach, in one line each.
- `get_rule`: full detail on one rule, looked up by id or by an npm
  package name it replaces. Returns `{ found: false }` rather than an
  error when nothing matches.

Data is a static snapshot, the same one `npx youmightnotneed` and
youmightnotneed.dev use. No network calls happen at tool-call time.

Powered by [`@jomae/catalog`](https://www.npmjs.com/package/@jomae/catalog).
MIT.
```

(Write the file without the backslash-escapes shown above. Those exist
only to keep the code fence itself parseable inside this plan document.
The actual `packages/mcp/README.md` file's own code fence around the JSON
config block should be a plain triple-backtick fence with `json` after it,
same as any other README.)

- [ ] **Step 6: Run copy check**

Run: `node scripts/check-copy.ts`
Expected: `Copy check passed.` If it fails, fix the flagged phrasing in whichever file it names (likely an em dash or banned word slipped into the README or a tool `description` string) and re-run.

- [ ] **Step 7: Full repo verify**

Run: `pnpm verify`
Expected: lint, typecheck, `test:coverage`, `knip`, `check:freshness`, and `check:copy` all pass, including the new `packages/mcp` workspace picked up automatically by `pnpm -r`.

- [ ] **Step 8: Commit**

`dist/` is gitignored repo-wide (`.gitignore:2`), matching `packages/cli/dist`. Do not add it.

```bash
git add CLAUDE.md README.md packages/mcp/README.md
git commit -m "docs: add MCP server README, update CLAUDE.md and root README"
```

Note: do **not** create a changeset for this package's first release. Changesets bump an *already-published* package's version from a changeset file; a brand-new package publishes whatever version is already in its `package.json` (`0.1.0`, set in Task 1) the first time `pnpm changeset publish` runs, the same way `youmightnotneed@0.1.3` published automatically once its version was bumped and it wasn't found in the registry yet, observed this session. Publishing itself (branch, PR, CI green, merge, then `pnpm changeset publish`, falling back to a local run if the automated publish step fails) is a follow-up step after this plan's tasks are merged, not part of this plan.
