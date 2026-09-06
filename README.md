# youmightnotneed

Is it CSS yet?

Find the CSS, HTML, or Web API that replaces your JavaScript dependencies.
Website, CLI, MCP server, and one rule catalog underneath all three.

```
npx youmightnotneed              # audit the nearest package.json
npx youmightnotneed --package swiper --verbose
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

## Nor are the version numbers

A rule's conditions often name a specific version: "below Chrome 92, Firefox 95
or Safari 15.4". Those were typed by hand once, and a review found seven of
them wrong, all in the direction that gets someone shipping broken code.

So they are no longer typed. A rule writes a token:

```ts
"You support browsers below Safari {{safari:api.Crypto.randomUUID}}."
```

`pnpm refresh:support` resolves it from `web-features`, or from MDN's
browser-compat-data when the claim is finer than web-features rolls up, and
commits the result. A token the sources cannot confirm fails the refresh
rather than shipping a guess. A committed number that stops matching its
source fails the freshness check. A literal version anywhere in a rule file
fails the tests. The catalog cannot state a browser version it did not get
from the source data.

## Guides for the part this does not cover

A rule says which dependency has a native equivalent and gives one snippet. It
does not try to be the tutorial. Where someone else has already written that,
a rule points at it: `guides` holds IDs from Google Chrome's
[modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance),
Apache-2.0, and `--verbose` prints them.

```
npx -y modern-web-guidance@latest retrieve "carousel-snap-highlights"
```

Their guides are keyed by use case and ours by package name, so the two meet
without overlapping. Only the IDs are stored here. The index is snapshotted
from their published npm package by `pnpm refresh:guides`, and a rule pointing
at a guide that no longer exists fails the freshness check rather than
shipping as a dead link.

## Two skills, pointing opposite ways

`.claude/skills/` is for working on this repo: how to add a rule, and the
house voice. It is never published.

`skills/youmightnotneed/` is for an agent using the catalog on someone else's
codebase. `SKILL.md` stays short, `references/reading-a-finding.md` covers how
to act on a report without overstating it, and `references/catalog.md` is
generated from the rules by `pnpm refresh:skill`, with a use-case index at the
top so an agent can find the platform answer before it installs anything.
Install it with `/plugin marketplace add jomaendle/youmightnotneed`.

## Layout

```
packages/catalog   @jomae/catalog, MIT, published to npm
packages/cli       npx youmightnotneed
packages/mcp       npx youmightnotneed-mcp, an MCP server for agents
apps/web           youmightnotneed.dev
skills             the agent skill, with a generated catalog reference
scripts            snapshot generators and the freshness check
```

`detect()` is a pure function: a parsed dependency map in, findings out. No
filesystem, no network, no clock. Every surface calls the same one, which is
why the CLI, the website, and the MCP server cannot disagree. A test asserts
the purity by reading the source, so an accidental `node:fs` import fails
the run.

## Working on it

```
pnpm install
pnpm verify          # lint, typecheck, test, freshness
pnpm dev             # the website
pnpm cli             # the CLI, against this repo
pnpm mcp             # the MCP server, over stdio
pnpm refresh         # re-snapshot Baseline data, sizes, guides and the skill
```

## Adding a rule

One file per rule in `packages/catalog/src/rules/`, exported from the index.
The schema will tell you what is missing. The parts worth thinking about:

- `replaces` takes exact npm names, and each package may be claimed by one rule
  only, so a report never lists the same dependency twice. Check the name
  exists: `pnpm refresh:sizes` reports anything it cannot find.
- `guides` is optional and holds modern-web-guidance IDs. Run
  `pnpm refresh:guides` first if the guide is newer than the snapshot, or the
  freshness check will reject the ID.
- `featureIds` lists only the features the replacement *requires*. A feature
  that merely makes the snippet nicer would understate the rule's support, so
  mention those in `unless` instead.
- `unless` is the field that matters most. An answer that always says "the platform covers it"
  is worse than no answer. Write the cases where you would keep the library.

Run `pnpm test`. Beyond the schema, the suite checks that no rule tells the
reader to delete anything, that limited-availability rules flag their support
in `unless`, and that the copy follows the house voice in
`.claude/skills/writing-voice/SKILL.md`.

## Licence

MIT. The catalog is the useful part, so take it.
