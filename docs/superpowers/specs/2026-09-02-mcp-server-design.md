# MCP server design

Status: approved, not yet implemented.

## Context

`CLAUDE.md`'s "Not building" section gates the MCP server and the
`modern-css` skill behind "Launch 1" landing. The user decided to revise that
gate and build the MCP server now, as the first of the two roadmap items.
This spec covers the MCP server only. The `modern-css` skill is a separate,
later design.

## Purpose

Expose `@jomae/catalog`'s existing analysis to an MCP-capable agent (Claude
Code, Claude Desktop, or any other MCP client) as tools, so an agent can:

1. Audit a project's dependencies against the catalog without shelling out to
   the CLI.
2. Check whether a single npm package already has a native replacement
   before adding it as a dependency.
3. Browse the whole catalog.

## Non-goals

- No hosted/remote server, no auth. Stdio only, matching
  `CLAUDE.md`'s existing "Not building: accounts, auth" line.
- No live network calls (bundlephobia, npm registry, web-features). Uses the
  same committed snapshot the CLI and website already use.
- No file-path input. The server never reads a `package.json` off disk
  itself: the agent supplies the parsed dependency fields directly. Keeps the
  server's only dependency-facing surface identical to `detect()`'s own pure
  input shape, and avoids giving an MCP server filesystem access it doesn't
  need.
- Does not replace or wrap the CLI. Both exist; a user chooses the surface
  that fits (terminal vs. agent tool call).

## Package

New `packages/mcp`, following `packages/cli`'s conventions exactly:

- Name: `youmightnotneed-mcp` (unscoped, matches the CLI's public-facing
  naming: this ships as its own `npx`-run command, not an internal library).
- `type: "module"`, `"engines": { "node": ">=22.18.0" }`.
- `dependencies`: `"@jomae/catalog": "workspace:*"`, `"@modelcontextprotocol/sdk"`.
- `bin: { "youmightnotneed-mcp": "./dist/bin.js" }`.
- Source-first dev (`exports`/`main`/`types` → `./src/index.ts` isn't
  applicable here since this package has no library export, only a bin:
  matches `cli`'s bin-only shape, no `exports` field needed), compiled for
  publish (`publishConfig` block pointing at `./dist/bin.js`, same pattern as
  `cli`'s `dist/bin.js`).
- `files: ["dist", "README.md"]`.
- Scripts: `build` (`tsc -p tsconfig.build.json`), `typecheck`, `start`
  (`node src/bin.ts`), `test`, `test:coverage`. Identical names to `cli` so
  the root `verify` script picks them up via `pnpm -r` with no changes there.
- `tsconfig.json`/`tsconfig.build.json` extending `tsconfig.base.json`, same
  as every other package.
- Included in changesets versioning by default (not added to the `ignore`
  list in `.changeset/config.json`, which currently only excludes
  `@youmightnotneed/web`).

## File layout

Mirrors `bin.ts`'s separation of pure logic from I/O, the same shape
`packages/cli/src/bin.ts` already uses and that this session's CLI fix
depended on being testable in isolation:

- `src/tools.ts`: pure handler functions, no MCP SDK import. Each takes a
  plain-JS input and returns a plain-JS output by calling straight into
  `@jomae/catalog`. Fully unit-testable with vitest without spinning up a
  server or transport.
- `src/server.ts`: thin adapter. Constructs the MCP `Server`, registers the
  three tools (name, JSON-schema `inputSchema`, handler that calls into
  `tools.ts` and wraps the result as the tool's structured output), wires
  stdio transport.
- `src/bin.ts`: executable entry point. Shebang, imports `server.ts`, starts
  it. Uses the **same entry-point guard** `packages/cli/src/bin.ts` just had
  fixed this session (`realpathSync()` + `pathToFileURL()` before comparing
  to `import.meta.url`). npx invokes this bin through the exact same
  `node_modules/.bin` symlink mechanism, so it needs the same fix from day
  one rather than reproducing the bug this session just spent two review
  rounds fixing.

## Tools

### `analyze_dependencies`

Input (JSON schema, mirrors `PackageJsonLike`):

```ts
{
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}
```

Output: the catalog's `Report` shape verbatim (`findings`, `summary`), plus a
`provenance` object:

```ts
{
  findings: Finding[];
  summary: Summary;
  provenance: {
    baselineOn: string;        // BASELINE_DATA_DATE
    webFeaturesVersion: string; // WEB_FEATURES_VERSION
    sizesOn: string;            // packageSizes.fetchedOn
  };
}
```

Implementation: `analyzeDependencies(input)` in `tools.ts` calls
`analyze(input)` from `@jomae/catalog` and appends the provenance block. No
validation beyond what `detect()` itself does today (an empty/missing field
is just treated as no dependencies in that field). Matches the CLI's own
lack of upfront validation.

### `list_rules`

No input. Output: lightweight array, not full `Rule` objects, so agents can
skim the whole catalog cheaply:

```ts
{ rules: Array<{ id: string; title: string; replaces: string[]; native: string }> }
```

Implementation: maps over the catalog's exported `rules` array, picking four
fields per rule.

### `get_rule`

Input: exactly one of `id` or `package`:

```ts
{ id: string } | { package: string }
```

Output:

```ts
{ found: true; rule: Rule; baseline: BaselineInfo }
| { found: false }
```

Implementation: looks up via the catalog's existing `rulesById` /
`rulesByPackage` maps, then calls `resolveBaseline(rule)` for the matched
rule. Returns `{ found: false }` on no match rather than throwing. Matches
`resolveFeature()`'s existing no-throw-on-unknown-input philosophy elsewhere
in the catalog, and gives the agent a value to branch on instead of a
try/catch.

If both `id` and `package` are supplied, `id` wins (documented in the tool's
description, not enforced with an error: an agent supplying both is giving
redundant, not conflicting, information in the common case where it already
knows both for a rule it just got from `list_rules`).

## Error handling

- Tool handlers in `tools.ts` never throw for "not found" or "no matches."
  They return a value describing that (`{ found: false }`, an empty
  `findings` array). Matches the catalog's own no-throw ethos for expected
  "nothing here" outcomes.
- `server.ts`'s adapter layer catches any unexpected exception from a handler
  (a bug, not an expected empty result) and surfaces it as an MCP tool error
  response rather than crashing the server process. One bad call shouldn't
  take down the stdio connection for the rest of the session.

## Testing

- `tools.test.ts`: unit tests for all three handlers against `tools.ts`
  directly (no SDK, no transport), same style as `packages/catalog`'s
  existing tests against `detect()`. Covers: a `package.json` with matches,
  one with none, `get_rule` by id, by package, by neither/unknown, and both
  provided at once.
- A `bin.ts` entry-point regression test analogous to the one just added to
  `packages/cli/src/bin.test.ts` (invoke through a real
  `node_modules/.bin`-style symlink), since this package has the identical
  npx-invocation shape and the identical risk of the same regression.
- No test spins up a real MCP client. `server.ts`'s tool registration is thin
  enough that testing `tools.ts` directly covers the actual logic, and a
  full client/server integration test would mostly be testing the SDK
  itself.

## Documentation

- `packages/mcp/README.md`: what the server does, the three tools, and a
  copy-pasteable MCP client config snippet (`npx youmightnotneed-mcp` as the
  command) for Claude Code / Claude Desktop.
- Root `README.md`: a short section pointing at the new package, matching
  the existing "CLI" section's format.
- `CLAUDE.md`: revise the "Not building" line. Remove "The MCP server ... are
  Launch 2, and only if Launch 1 lands" (the MCP server is now being built);
  keep the `modern-css` skill in "Not building" since that's still a
  separate, later decision. Add `packages/mcp` to the "Layout" section.

## Release

Same flow as every other change this session: branch, PR, CI green, merge,
changeset-driven "Version Packages" PR, merge, publish (falling back to
local `pnpm changeset publish` if the CI `NPM_TOKEN` issue from this session
recurs: the token was fixed via `npm login` locally and re-publish
succeeded, but the CI secret itself was never rotated).
