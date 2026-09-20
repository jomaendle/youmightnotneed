---
name: finding-rules
description: Use when hunting for new catalog rules, checking whether a candidate is worth writing, or auditing the catalog for gaps. Defines what counts as a candidate, where to look, what to extract, and what to reject.
metadata:
  internal: true
---

# Finding rules

`adding-a-rule` covers writing one once you have it. This covers deciding
there is one to write.

The goal is coverage: one tool to identify and apply modern web best
practices, and every library the platform has absorbed should have a rule.
Reach is worth pursuing hard. The constraint is that a finding has to be
checkable, which is what stops the catalog turning into advice.

## 1. What counts as a candidate

A rule needs an **entry point**: something findable in a real project, so a
report can fire on it rather than lecturing. There are three.

**A package name.** The common case. `replaces` lists npm packages and
`detect()` matches them against a package.json.

**A hand-rolled shape.** Code someone wrote instead of installing something,
described in prose in `agent.handRolled`. This is the larger half of what
agents actually write, and no package.json scan can ever see it. Shapes never
stand alone though: `replaces` is `min(1)`, so a rule still has to name the
library someone would otherwise have reached for.

**A practice worth naming.** "Use `<dialog>`", "use `light-dark()`". Note
these are usually *the same rules read from the other end*: the `dialog` rule
already holds the native snippet, the conditions and the shapes. Prefer
projecting an existing rule over writing a second entry that repeats it. If
the practice has no library and no hand-rolled shape behind it, there is
nothing to detect and it belongs in a guide reference, not a rule.

Whatever the entry point, two things are non-negotiable:

- **A `web-features` ID**, so the tier is derived and never authored. No ID
  and no defensible `manualBaseline` means it is not ready.
- **Real `unless` conditions.** Write these first. If you cannot think of two,
  you do not understand the replacement well enough to publish it yet.

### Limited availability is a tier, not a rejection

The catalog ships limited rules on purpose. The CLI renders them under "not
in every engine yet, so it needs a fallback" and the site under "Missing from
at least one engine. These need a fallback." A feature one engine has shipped
is worth a rule: someone choosing a library today should know the platform
is coming, and the day it crosses, the rule is already written and the
`--since` view picks it up.

Two obligations come with it. The first `unless` says plainly that this needs
a fallback today and names which engines are missing, through
`{{browser:feature-id}}` rather than a typed version. And the framing is
honest about what the swap is: for a feature only Chrome has, dropping the
library means shipping a polyfill or an enhancement, not deleting code.

Where the whole value is the polyfill, say so in the explainer. A rule that
reads as "delete this" when the honest answer is "this is coming" is the
failure the `unless` field exists to prevent.

## 2. Where to look

Ordered by hit rate.

**The Baseline timeline.** Features that crossed to widely or newly available
recently are the richest seam, because the ecosystem has not caught up yet.
These are also the best `--since` material.

```
node -e "const wf=require('web-features');
for (const [id,f] of Object.entries(wf.features)) {
  const d=f.status?.baseline_high_date; if (d && d>'2025-01-01') console.log(d,id);
}" | sort
```

**The modern-web-guidance index.** 143 guides, and the unreferenced ones
describe native capabilities someone is currently doing with a library.

```
node --experimental-strip-types -e "
import('./packages/catalog/src/generated/guides.ts').then(({guideSnapshot})=>
  Object.entries(guideSnapshot.guides).forEach(([id,cat])=>console.log(cat,id)));"
```

**npm download rankings**, crossed with gzipped size. The headline is
replaceable kilobytes, so a heavy widely-installed package is worth far more
than a 2 kB utility. npm's registry API gives downloads; bundlephobia gives
size.

**Polyfills.** The cleanest possible finding: the platform covers them
completely and the `unless` list is genuinely short. Search a large
package.json for anything ending `-polyfill` or starting `polyfill-`.

**Your own catalog's edges.** A rule's `unless` often names the library that
covers the gap, and that library may deserve its own rule. Categories with few
rules are usually under-explored rather than exhausted.

## 3. What to extract

For each candidate, collect all of this before writing anything:

| Field | How |
|---|---|
| Packages, exact npm names | `curl -s -o /dev/null -w "%{http_code}" https://registry.npmjs.org/<pkg>` |
| Already claimed? | `rulesByPackage.get(pkg)` must be undefined |
| Weekly downloads | `https://api.npmjs.org/downloads/point/last-week/<pkg>` |
| Gzipped size | bundlephobia, or `pnpm refresh:sizes` once it is in `replaces` |
| `web-features` ID | `Object.keys(require('web-features').features).filter(...)` |
| Tier and crossing dates | `f.status.baseline`, `baseline_low_date`, `baseline_high_date` |
| At least two `unless` | From reading the library's own docs for what it does beyond the native API |
| A hand-rolled shape or two | What people write when they do not install it |

## 4. Verify before you write

The machinery catches feature IDs, browser versions, package names, sizes and
voice. It cannot tell whether a sentence is true.

- **Execute the claim.** Run the native API in Node and look at the output.
  This session: `Intl.PluralRules` returns a category and never a word, NFD
  leaves the stroke on `Ł` alone, and `kibibyte` throws a `RangeError`. All
  three would have been written wrong from memory, and each became a
  condition.
- **Check the API name against browser-compat-data** before a snippet uses
  it, not after.
- **Read a guide before linking it.** A plausible ID is not evidence. See
  `adding-a-rule`.
- **Never type a browser version or a year.** `{{chrome:feature-id}}` or
  nothing. A hand-written "since 2023" shipped once and contradicted the
  rule's own data.

## 5. Reject these

Worked examples, all real:

- **The rule's own `unless` names the library.** `random-uuid` says short IDs
  are what nanoid is for, so adding nanoid to `replaces` would fire on it and
  then recommend it.
- **The fix is configuration, not a swap.** `core-js` is the largest number
  available, 52.7M weekly against 88.8 kB, but you remove it by raising your
  `browserslist` target. That is not "this dependency, that API".
- **The feature has no `web-features` ID at all**, and no defensible
  `manualBaseline`. A tier that cannot be derived is a tier someone typed.
- **The package ships nothing to the browser.** A PostCSS plugin runs at
  build time, so counting it inflates a headline that promises page weight.
  Raise it rather than shipping it.
- **The saving is trivial.** `clsx` and `classnames` are 113M weekly combined
  and 0.3 kB. A correct finding that moves no number.
- **The library does substantially more.** The bar is that the platform
  replaces it outright. `lodash` is not `Object.groupBy`.
- **The download count is transitive.** `object-assign` has 128M weekly
  installs and almost nobody depends on it directly, so a package.json scan
  will not see it.

## 6. Then

`adding-a-rule` has the writing sequence, the guide method and the refresh
pipeline. Run `pnpm verify` and exercise the real binary before calling it
done.
