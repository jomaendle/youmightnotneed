# Best-practice guidance: where it goes, and why not in the catalog

Status: proposal. Nothing here is built. Written so the decision is made once,
before anyone starts.

## What is being asked for

Guidance on modern web practice, in the shape of
[`vercel-labs/agent-skills/skills/react-best-practices`](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices):
advice an agent can apply while writing code, covering both the platform
(`fetchpriority` on the LCP image, speculation rules, bfcache eligibility) and
frameworks (React and Next.js patterns).

That skill is built from one markdown file per rule, with frontmatter carrying
`title`, `impact`, `impactDescription` and `tags`, a wrong/right code pair in
the body, topic encoded as a filename prefix (`async-`, `bundle-`, `rerender-`),
compiled into a single `AGENTS.md`, with a `test-cases.json` of eval cases
alongside.

## Recommendation

Build it as `skills/web-best-practices/`, a sibling of
`skills/youmightnotneed/`. Do not put it in `packages/catalog`.

## Why not in the catalog

The catalog's four surfaces cost one implementation because every rule
satisfies the same three invariants. A guidance entry satisfies none of them:

- **No npm package to match.** `detect()` is keyed on package names and the
  package.json report is the primary surface. "Do not fetch in a `useEffect`
  waterfall" has nothing to match against, so it can never appear in a report.
- **No `web-features` ID, so no derived tier.** Baseline status being derived
  and never authored is the invariant the catalog bends least. A React pattern
  has no Baseline status at all, and inventing one would be the first hardcoded
  status in the project.
- **No replaceable kilobytes.** The headline number is the whole framing.
  Guidance entries would have to be excluded from every aggregate on the site:
  the rule count, packages covered, the tier tally and the sparkline history.

Making `replaces`, `featureIds` and the tier all optional to fit guidance in
would remove exactly the constraints that make a catalog rule checkable by a
script. `replaces` min(1) and `unless` min(1) exist to force a rule to be
falsifiable. Guidance needs its own discipline, a cited source and a stated
impact, rather than a weakened version of this one.

## Proposed shape

```
skills/web-best-practices/
  SKILL.md                  hand-written, no counts in it
  rules/
    loading-lcp-fetchpriority.md
    perf-speculation-rules.md
    a11y-focus-on-route-change.md
    react-avoid-effect-waterfalls.md
    next-server-component-boundaries.md
  references/practices.md   generated, never hand-edited
  test-cases.json
```

- Frontmatter per file: `title`, `impact`, `tags`, `source` (a URL), and
  optional `rule` naming a catalog rule id.
- A script in `scripts/` compiles `rules/*.md` into `references/practices.md`,
  the same way `scripts/build-skill.ts` already generates
  `references/catalog.md`. `check:freshness` fails on drift, and `SKILL.md`
  carries no counts, matching the existing rule in CLAUDE.md.
- Distribution through the existing `.claude-plugin/` marketplace, which
  already ships the catalog skill.
- The link to the catalog is one-directional: a practice may name a rule id, so
  "do not install a carousel library" hands off to `carousel-scroll-markers`.
  The catalog does not need to know practices exist.

CLAUDE.md already reserves the slot: "The `modern-css` skill is Launch 2, and
only if Launch 1 lands." This is that slot, widened past CSS.

## The argument against, stated plainly

The catalog is credible because it is narrow and every claim traces to a
committed snapshot. A wrong entry fails a test rather than a review.

Guidance has none of that. It is opinionated, it goes stale on a different
clock than Baseline does, and no script can check it. Shipping it under the
same name spends the catalog's credibility on claims the catalog's machinery
cannot back.

If it ships, the sourcing bar has to be higher rather than lower:

- Every entry cites a primary source, and whoever adds it has read the source.
  The catalog already learned this the hard way with guide links: a review
  found three that were wrong and every one looked right from the ID alone.
- Every entry states when it does not apply, the same role `unless` plays in a
  rule. An entry that always says yes is worse than no entry.
- Framework entries name the version range they were verified against, because
  React and Next.js advice expires in a way `Intl.ListFormat` does not.
