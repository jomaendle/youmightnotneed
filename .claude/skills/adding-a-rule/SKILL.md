---
name: adding-a-rule
description: Use when adding a new rule to packages/catalog (a new "you might not need X" entry), or when checking whether a candidate feature is a good fit before writing one.
---

# Adding a catalog rule

A rule maps one or more npm packages to the native browser feature that
replaces them: CSS, HTML, or a JavaScript Web API. This is the exact
sequence, in order. Skipping a step fails CI, not a review comment.

## 1. Confirm it fits

- The replacement must be something the browser ships, not a JavaScript
  library reimplementing browser-adjacent logic. `detect()` only claims
  "you might not need this dependency because the platform does it," and
  the site's whole premise depends on that being narrowly true. A rule
  claiming a Web API (Bluetooth, Web Share, clipboard, and so on) needs the
  same rigor as a CSS one: a real `unless` list, and a native method that
  genuinely does what the package did, not just something adjacent to it.
- The feature must have a `web-features` ID. Check with:
  ```
  node -e "console.log(Object.keys(require('web-features').features).filter(k => k.includes('your-term')))"
  ```
  No ID and no case for a `manualBaseline` escape hatch (see schema.ts) means
  this isn't ready yet.
- Every package in `replaces` must be unclaimed. Check
  `packages/catalog/src/rules/*.ts` or just try the build. A package claimed
  twice fails `catalog.test.ts`.

## 2. Write the rule file

New file at `packages/catalog/src/rules/<id>.ts`, one `Rule` object (see
`schema.ts` for the full shape). Use an existing small rule (e.g.
`aspect-ratio.ts`) as the template. Required parts:

- `category`: one of the ids in `packages/catalog/src/categories.ts`, picked
  by hand like `title`. No script generates it.
- `replaces`: exact, lowercase npm package names.
- `featureIds`: the web-features IDs REQUIRED to make the replacement work.
  Nice-to-have features go in `agent.unless` instead, not here, or the
  rule understates itself.
- `human.explainer`: 2 to 4 sentences, `human.snippet`: copy-pasteable.
- **Never type a browser version.** Write `{{browser:key}}` instead, where
  key is a web-features ID (`{{safari:inert}}`) or a BCD path
  (`{{safari:api.Crypto.randomUUID}}`) when you need member-level detail that
  web-features rolls up. `pnpm refresh:support` resolves it and fails if the
  source data cannot confirm it, which is the point: if no source has the
  number, the condition needs rewording rather than a guess. A literal
  `Safari 15.4` in a rule file fails `catalog.test.ts`.
- `guides` (optional): IDs from GoogleChrome/modern-web-guidance. See the
  section below, and read the guide before you link it.
- `agent.when` / `agent.unless`: the LLM-facing projection. `unless` cannot
  be empty. This is the most important field in the schema: write it before
  anything else if you're unsure the rule is real. An empty or weak `unless`
  means the finding overstates itself.

Before writing any of the prose, load `.claude/skills/writing-voice/SKILL.md`.
No em dashes, no "not X, it's Y", no banned vocabulary. `check:copy` enforces
this and will fail the build otherwise.

## 3. Pick the guides, if any

A rule says which dependency can go and gives one snippet. The long form,
fallbacks and platform quirks live in GoogleChrome/modern-web-guidance, and
`guides` is the hand-off. Their guides are keyed by use case, ours by package
name, which is what makes them fit.

Find candidates by searching the committed index for the topic:

```
node -e "const {guideSnapshot}=require('./packages/catalog/src/generated/guides.ts');
for (const [id,cat] of Object.entries(guideSnapshot.guides))
  if (id.includes('scroll')) console.log(cat+'/'+id)"
```

Then **read the guide before linking it**. This is not optional and it is not
paranoia: a review found three of the existing links wrong, and every one of
them looked right from the ID alone.

```
npx -y modern-web-guidance@latest retrieve "<id>"
```

A guide belongs on a rule only if it implements *this rule's native approach
for this rule's use case*. The three that were wrong all failed that test:

- `format-human-readable-durations` was on the `Intl.RelativeTimeFormat` rule,
  but it teaches `Temporal.Duration`, a different API.
- `deliver-optimized-decorative-images` was on the `loading="lazy"` rule, but
  it is about `image-set()` for CSS backgrounds.
- `light-dismiss-a-dialog` was on the `inert` rule, but light dismiss is about
  closing an overlay, not about keeping focus inside one.

Two more rules of thumb. A guide that only mentions your feature in passing is
not a match, and a guide already claimed by the rule that owns its use case
should stay there rather than being listed twice.

Where the ID is newer than the committed index, run `pnpm refresh:guides`
first. An unknown ID fails `catalog.test.ts` and `check:freshness`, so a guide
renamed upstream can never ship as a dead link.

Many rules have no guide at all. That is the normal case, not a gap: their
guide set does not cover masonry, aspect-ratio, clipboard, the observers, or
most of the JavaScript APIs, and inventing a loose link is worse than none.

## 4. Register it

Add the import and the array entry in `packages/catalog/src/rules/index.ts`.
Order in the array is not significant.

## 5. Generate the data the rule depends on

```
pnpm refresh:baseline   # pulls featureIds' status into generated/baseline.ts
pnpm refresh:sizes       # fetches bundlephobia sizes for every claimed package
pnpm refresh:guides      # snapshots the modern-web-guidance index
pnpm refresh:support     # resolves every {{browser:key}} token in the prose
pnpm refresh:skill       # regenerates the skill's catalog reference
```

`pnpm refresh` runs all five. The skill reference must be regenerated for any
new rule, or `check:freshness` fails.

All four are safe to run even when nothing else changed: existing entries
survive a failed fetch. Check the output of `refresh:sizes` for "No size for N
package(s)". That means a typo in `replaces`, since the rule can never match
a package that doesn't exist on npm.

## 6. Verify

```
pnpm verify
```

This runs lint, typecheck, tests (which assert every `featureId` resolves to
a real, non-"unknown" status, and that no package is claimed twice), knip,
the freshness check, and the copy check. All of it has to pass, not just the
new rule's tests.

## 7. Smoke test

```
node packages/cli/src/bin.ts /path/to/some/package.json --verbose
```

Point it at a real package.json that has one of the claimed packages in it
and confirm the output reads the way you'd want a stranger to read it.

## What "done" looks like

A rule that fires precisely (no false positives against unrelated packages,
since `replaces` is an exact match), states real Baseline data (never
hardcoded), and has an `unless` list a maintainer would actually agree with
if a user pushed back on the finding.
