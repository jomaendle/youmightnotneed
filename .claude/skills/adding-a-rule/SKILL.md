---
name: adding-a-rule
description: Use when adding a new rule to packages/catalog (a new "you might not need X" entry), or when checking whether a candidate feature is a good fit before writing one.
---

# Adding a catalog rule

A rule maps one or more npm packages to the modern CSS or HTML that replaces
them. This is the exact sequence, in order. Skipping a step fails CI, not a
review comment.

## 1. Confirm it fits

- The replacement must be CSS or HTML, not a JS Web API. `detect()` only
  claims "you might not need this dependency because the platform does it,"
  and the site's whole premise depends on that being narrowly true. A
  clipboard or debounce helper does not belong here even if native APIs
  exist for them.
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

- `replaces`: exact, lowercase npm package names.
- `featureIds`: the web-features IDs REQUIRED to make the replacement work.
  Nice-to-have features go in `agent.unless` instead, not here, or the
  rule understates itself.
- `human.explainer`: 2 to 4 sentences, `human.snippet`: copy-pasteable.
- `agent.when` / `agent.unless`: the LLM-facing projection. `unless` cannot
  be empty. This is the most important field in the schema: write it before
  anything else if you're unsure the rule is real. An empty or weak `unless`
  means the finding overstates itself.

Before writing any of the prose, load `.claude/skills/writing-voice/SKILL.md`.
No em dashes, no "not X, it's Y", no banned vocabulary. `check:copy` enforces
this and will fail the build otherwise.

## 3. Register it

Add the import and the array entry in `packages/catalog/src/rules/index.ts`.
Order in the array is not significant.

## 4. Generate the data the rule depends on

```
pnpm refresh:baseline   # pulls featureIds' status into generated/baseline.ts
pnpm refresh:sizes       # fetches bundlephobia sizes for every claimed package
```

Both are safe to run even when nothing else changed: existing entries survive
a failed fetch. Check the output of `refresh:sizes` for "No size for N
package(s)". That means a typo in `replaces`, since the rule can never match
a package that doesn't exist on npm.

## 5. Verify

```
pnpm verify
```

This runs lint, typecheck, tests (which assert every `featureId` resolves to
a real, non-"unknown" status, and that no package is claimed twice), knip,
the freshness check, and the copy check. All of it has to pass, not just the
new rule's tests.

## 6. Smoke test

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
