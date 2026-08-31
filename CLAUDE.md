# youmightnotneed

Tells developers which JavaScript dependencies can go because modern CSS and
HTML now do the job. The product is the rule catalog. Every surface is a thin
adapter over it.

## Decisions that are settled

Do not relitigate these. If one looks wrong, say so in a sentence and carry on.

- **Input is a dependency list, not code.** No LLM in the hot path. Matching a
  `package.json` against a lookup table is free, exact and needs no typing.
  There is no paste-your-JSX mode.
- **`detect()` is pure.** No filesystem, no network, no `process`, no clock. It
  is what makes four form factors cost one implementation. A test enforces this
  by reading the source.
- **Baseline status is derived, never hardcoded.** Rules store `web-features`
  IDs. `scripts/refresh-baseline.ts` commits a snapshot. A rule reports its
  least-supported required feature.
- **Findings are conditional, never instructions.** "If you're using X for Y,
  Z covers that case", not "delete X". Sizes are "up to", never "you will
  save". Tests enforce the phrasing.
- **Headline number is replaceable kilobytes**, minified and gzipped.
- **Permalinks encode the report in the URL.** No database. Nobody's
  `package.json` is stored.
- **Dark mode is the only theme.** Tailwind 4, CSS-first `@theme` in
  `globals.css`, no `tailwind.config` file.

## Layout

```
packages/catalog   the rules, schema, baseline resolution, detect()
packages/cli       npx youmightnotneed
apps/web           youmightnotneed.dev
scripts            snapshot generators, freshness check
```

`packages/catalog/src/generated/` is written by the refresh scripts. Do not
edit it by hand, and do run `pnpm refresh` rather than patching numbers.

## Conventions

- pnpm workspaces, TypeScript 7 strict, Biome for lint and format. Not
  ESLint, not Prettier.
- Relative imports use the `.ts` extension. `rewriteRelativeImportExtensions`
  turns them into `.js` on emit, so Node can also run the sources directly.
- Before writing any user-visible text, including rule explainers, CLI output
  and the README, load `.claude/skills/writing-voice/SKILL.md`. No em dashes.
- `pnpm verify` runs lint, typecheck, tests and the freshness check. Run it
  before you call anything done.

## The `unless` field

The most important field in the schema. An agent that always answers "use CSS"
is worse than no agent. Every rule states when the dependency is still right,
and the schema rejects an empty list. When adding a rule, write `unless` first.

## Not building

VS Code extension, hosted playground, accounts, auth. The MCP server and the
`modern-css` skill are Launch 2, and only if Launch 1 lands.
