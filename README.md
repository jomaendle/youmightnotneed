# youmightnotneed

Is it CSS yet?

Find the modern CSS and HTML that replaces your JavaScript dependencies.
Website, CLI, and one rule catalog underneath both.

```
npx youmightnotneed
```

`npx` works whether or not the package is installed. It resolves a local
`node_modules/.bin` copy first. The bare `youmightnotneed` command only
works after a global install.

Point it at a repo and it reads `package.json`, matches your dependencies
against the catalog, and prints what the platform now does natively, how much
each library weighs, and how well the replacement is supported.

## What it actually claims

A dependency in `package.json` is not proof of what it is used for. Someone
installs Framer Motion for layout animations, not for fade-ins. So a finding
here is a conditional:

> If you're using `swiper` for a horizontal gallery with prev/next and dots,
> CSS scroll-snap with `::scroll-button()` and `::scroll-marker()` covers that
> case.

Every finding ships with its Baseline status and with the conditions where the
library is still the right call. A rule with an empty `unless` list fails the
schema, so it cannot be added by accident. Sizes are phrased as "up to",
because they assume a full replacement that may not apply to you.

## Baseline status is never hardcoded

Browser support moves monthly and any number written by hand will eventually be
wrong in public. Rules store `web-features` IDs. A build step resolves those
into widely, newly or limited and commits the snapshot, so the data is
reviewable in a diff and the published package carries no runtime dependency on
it.

A rule is only as available as its least-supported required feature. Tooltips
need both the Popover API and CSS anchor positioning, and anchor positioning
has not reached Baseline, so the whole rule reads as limited even though half
of it is everywhere. The weakest link is what decides whether you can ship.

Where a feature has no `web-features` ID yet, a rule may carry a
`manualBaseline` with a `verifiedOn` date. CI fails once that date is more than
90 days old.

## Layout

```
packages/catalog   @jomae/catalog, MIT, published to npm
packages/cli       npx youmightnotneed
packages/mcp       npx youmightnotneed-mcp, an MCP server for agents
apps/web           youmightnotneed.dev
scripts            snapshot generators and the freshness check
```

`detect()` is a pure function: a parsed dependency map in, findings out. No
filesystem, no network, no clock. Every surface calls the same one, which is
why the CLI and the website cannot disagree. A test asserts the purity by
reading the source, so an accidental `node:fs` import fails the run.

## Working on it

```
pnpm install
pnpm verify          # lint, typecheck, test, freshness
pnpm dev             # the website
pnpm cli             # the CLI, against this repo
pnpm refresh         # re-snapshot Baseline data and bundle sizes
```

## Adding a rule

One file per rule in `packages/catalog/src/rules/`, exported from the index.
The schema will tell you what is missing. The parts worth thinking about:

- `replaces` takes exact npm names, and each package may be claimed by one rule
  only, so a report never lists the same dependency twice. Check the name
  exists: `pnpm refresh:sizes` reports anything it cannot find.
- `featureIds` lists only the features the replacement *requires*. A feature
  that merely makes the snippet nicer would understate the rule's support, so
  mention those in `unless` instead.
- `unless` is the field that matters most. An answer that is always "use CSS"
  is worse than no answer. Write the cases where you would keep the library.

Run `pnpm test`. Beyond the schema, the suite checks that no rule tells the
reader to delete anything, that limited-availability rules flag their support
in `unless`, and that the copy follows the house voice in
`.claude/skills/writing-voice/SKILL.md`.

## Licence

MIT. The catalog is the useful part, so take it.
