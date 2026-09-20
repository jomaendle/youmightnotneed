# youmightnotneed

Tells developers which JavaScript dependencies can go because the platform
now does the job: CSS, HTML, or a Web API. The product is the rule catalog.
Every surface is a thin adapter over it.

## The vision

**One tool to identify and apply modern web best practices.** *Identify* is
the catalog. *Apply* is the hand-off: the skill, the MCP server and the
guides.

Every other tool compares a codebase against itself (knip: unreferenced,
Renovate: out of date) or against a ceiling (`eslint-plugin-compat`: too new
for your targets). Nothing compares it against the platform's moving floor, so
a dependency that is imported, current, maintained and redundant is invisible
to all of them. The join nobody else computes is `package.json × Baseline
date`: the timeline is a commodity, the mapping is not.

Coverage is the goal, and reach is worth pursuing hard. **Package-keyed is how
we enter, not the limit of what we cover.** A rule starts from something
findable in a real project, a package name or a hand-rolled shape, because
that is what makes a finding checkable and keeps the tool from lecturing.
Growing toward best practices means more entry points, not untethered advice:
a claim that cannot be checked against committed data does not belong here
yet.

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
- **No browser version is ever written by hand.** Not the tier, not the
  numbers in prose. A rule writes `{{safari:api.Crypto.randomUUID}}` and
  `scripts/refresh-support.ts` resolves it from `web-features` or from MDN's
  browser-compat-data. A token with no source fails the refresh, a committed
  number that no longer matches its source fails `check:freshness`, and a
  literal `Safari 15.4` anywhere in a rule file fails the tests. This exists
  because a review found seven rules naming a version the source contradicts.
- **Findings are conditional, never instructions.** "If you're using X for Y,
  Z covers that case", not "delete X". Sizes are "up to", never "you will
  save". Tests enforce the phrasing.
- **Headline number is replaceable kilobytes**, minified and gzipped.
- **Baseline dates are queryable.** `baselineSince(info)` gives the date a
  rule reached its current tier, `splitSince(findings, date)` partitions a
  report, and `--since` narrows the CLI. Dates are `YYYY-MM-DD` and compare
  lexicographically, never through `Date`, which keeps them usable from the
  pure core.
- **Permalinks encode the report in the URL.** No database. Nobody's
  `package.json` is stored.
- **Dark is the default, not the only theme.** `color-scheme: dark light`, so
  a reader whose OS asks for light gets light. Colours are `light-dark()`
  pairs on one token. Tailwind 4, CSS-first `@theme` in `globals.css`, no
  `tailwind.config` file.

## Layout

```
packages/catalog   the rules, schema, baseline resolution, detect()
packages/cli       npx youmightnotneed
packages/mcp       npx youmightnotneed-mcp
apps/web           youmightnotneed.dev
skills             the distributable agent skill, for people using the catalog
scripts            snapshot generators, freshness check
```

Two kinds of skill, pointing opposite ways. `.claude/skills/` is for working
*on* this repo (`finding-rules`, `adding-a-rule`, `writing-voice`), never
published. `skills/youmightnotneed/` is for agents *using* the catalog
elsewhere, shipped through `.claude-plugin/`. A rule change affects the
second, so `pnpm refresh:skill` regenerates its reference and the freshness
check fails on drift. Keep counts and rule names out of its hand-written
SKILL.md: the generated `references/catalog.md` carries those.

`packages/catalog/src/generated/` (Baseline, Baseline history, sizes, guide
index, lint rules, support claims) and `skills/youmightnotneed/references/catalog.md` are written by the
refresh scripts. Do not edit them by hand, and do run `pnpm refresh` rather than
patching numbers.

`.mcp.json` at the repo root is the plugin's bundled MCP server, but Claude
Code also reads it as this repo's own project-scoped MCP config. It runs
`npx -y youmightnotneed-mcp`, the published package, not `packages/mcp`. A
rule added locally will not show up in those tools until it ships. Declining
the trust prompt writes `.claude/settings.local.json`, which is gitignored
and personal per machine, never commit it.

## Conventions

- pnpm workspaces, TypeScript 7 strict, Biome for lint and format. Not
  ESLint, not Prettier.
- Relative imports use the `.ts` extension. `rewriteRelativeImportExtensions`
  turns them into `.js` on emit, so Node can also run the sources directly.
- Before writing any user-visible text, including rule explainers, CLI output
  and the README, load `.claude/skills/writing-voice/SKILL.md`. No em dashes.
- `pnpm verify` runs lint, typecheck, tests with coverage, knip, the
  freshness check and the copy check. Run it before you call anything done.

## Guardrails

`pnpm verify` catches more than the schema. `catalog.test.ts` walks imports
from `PURE_ROOTS` and bans fs, network, `process` and clock.
`handrolled.test.ts` rejects a shape whose words overlap an `unless` saying
the feature does not cover it, because a shape like that tells an agent to
delete code the rule cannot replace. `demos.test.ts` wants a demo or a written
reason there is none. `check:freshness` rejects a `replaces` entry with no
size, and `scripts/unsizeable.ts` is the escape hatch for a package
bundlephobia genuinely cannot build.

What no script checks is whether a sentence is true:

- **Execute a claim rather than recalling it.** `Intl.PluralRules` returns a
  category and never a word; NFD leaves the stroke on `Ł` alone; `kibibyte`
  throws a `RangeError`. All three would have been written wrong from memory.
- **Exercise the real binaries.** Build and run `packages/cli/dist/bin.js`,
  drive the MCP server over stdio, and for the website `pnpm dev` and look at
  it. A clipped card and a hover that promised a click were invisible to both
  types and tests.
- **A rule has a `lintRule` or `handRolled` shapes, rarely both.** `lint.ts`
  publishes that split as a feature. `resize-observer` is the one exception.
- **Build-time packages do not belong in a page-weight headline.** A PostCSS
  plugin ships nothing, so counting it inflates the number.

## Guides are references, never copies

A rule may carry `guides`, IDs from GoogleChrome/modern-web-guidance
(Apache-2.0). Theirs are keyed by use case, ours by package name, so they
cover the implementation this catalog leaves out. Store IDs only; the
freshness check rejects one that disappears upstream. Do not vendor their
prose.

Read a guide before linking it. A plausible ID is not evidence: a review found
three links wrong, each pointing at an adjacent topic.
`.claude/skills/adding-a-rule/SKILL.md` has the method. Most rules have no
guide, which is fine.

## Categories

Every rule carries a `category` from `packages/catalog/src/categories.ts`,
which drives the sidebar and the filters. It is picked by hand like `title`,
and the closed union means a typo fails to type-check rather than creating a
silent ninth group. Match what comparable rules already use: Web Crypto and
data handling sit under `async-data`, anything `Intl` under `formatting`,
focus and overlays under `forms`.

## The `unless` field

The most important field in the schema. An agent that always answers "the platform covers it"
is worse than no agent. Every rule states when the dependency is still right,
and the schema rejects an empty list. When adding a rule, write `unless` first.

## Not building

VS Code extension, hosted playground, accounts, auth, ESLint plugin.

Not a documentation mirror. `docs/guidance-design.md` argued against vendoring
prose advice and that part still holds: guidance goes stale on a different
clock than Baseline, and Chrome's Modern Web Guidance already covers the
use-case-keyed ground with more maintenance behind it. Reference it, do not
rewrite it. The same reasoning is why `lintRule` points at a linter that
already does the job instead of this project growing a second implementation
of the same check. Broadening what counts as a finding is on the table;
shipping unverifiable advice is not.
