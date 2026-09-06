# youmightnotneed

Tells developers which JavaScript dependencies can go because the platform
now does the job: CSS, HTML, or a Web API. The product is the rule catalog.
Every surface is a thin adapter over it.

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
packages/mcp       npx youmightnotneed-mcp
apps/web           youmightnotneed.dev
skills             the distributable agent skill, for people using the catalog
scripts            snapshot generators, freshness check
```

There are two kinds of skill here and they point in opposite directions.
`.claude/skills/` is for working *on* this repo: `adding-a-rule` and
`writing-voice`, never published. `skills/youmightnotneed/` is for agents
*using* the catalog in someone else's codebase, installed through
`.claude-plugin/`. A change to the rules affects the second one, so
`pnpm refresh:skill` regenerates its catalog reference and the freshness
check fails if it drifts. Do not put counts or rule names in its hand-written
SKILL.md: the generated `references/catalog.md` carries those, and the
freshness check rejects a hardcoded count.

`packages/catalog/src/generated/` and
`skills/youmightnotneed/references/catalog.md` are written by the refresh
scripts. Do not edit them by hand, and do run `pnpm refresh` rather than
patching numbers.

## Conventions

- pnpm workspaces, TypeScript 7 strict, Biome for lint and format. Not
  ESLint, not Prettier.
- Relative imports use the `.ts` extension. `rewriteRelativeImportExtensions`
  turns them into `.js` on emit, so Node can also run the sources directly.
- Before writing any user-visible text, including rule explainers, CLI output
  and the README, load `.claude/skills/writing-voice/SKILL.md`. No em dashes.
- `pnpm verify` runs lint, typecheck, tests and the freshness check. Run it
  before you call anything done.

## Guides are references, never copies

A rule may carry `guides`, which are IDs from GoogleChrome/modern-web-guidance
(Apache-2.0). Their guides are keyed by use case, ours by package name, so
they cover the implementation this catalog deliberately leaves out. Store IDs
only. `scripts/refresh-guides.ts` snapshots their index from the published npm
package and the freshness check rejects an ID that no longer exists. Do not
vendor their prose: the catalog is a lookup table, not a documentation mirror.

## The `unless` field

The most important field in the schema. An agent that always answers "the platform covers it"
is worse than no agent. Every rule states when the dependency is still right,
and the schema rejects an empty list. When adding a rule, write `unless` first.

## Not building

VS Code extension, hosted playground, accounts, auth. The `modern-css`
skill is Launch 2, and only if Launch 1 lands.
