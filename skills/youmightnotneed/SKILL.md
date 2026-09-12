---
name: youmightnotneed
description: Find the CSS, HTML or Web API that covers a case before reaching for a library, check what an existing package.json could drop, and spot hand-written code the platform now does on its own. Use when about to install a frontend package, when building a UI behaviour that might already be native, when about to hand-write a focus trap, carousel, scroll lock, tooltip positioner or similar, when reviewing code for reimplementations of platform features, when asked whether a library is still needed, or when reviewing dependencies for weight. Covers carousels, dialogs, tooltips, popovers, scroll effects, transitions, date pickers, drag and drop, clipboard, text truncation, HTTP requests, UUIDs, query strings, hashing, event emitters, and date and number formatting.
---

# youmightnotneed

A lookup table from a use case, or an npm package name, to the platform
feature that covers it. Matching is exact and there is no model in the loop,
so it never guesses what a package does.

Two directions, and the first is the one that saves the most.

## Starting from what you are building

Before installing anything for a UI behaviour or a small utility, check
whether the platform covers it. Load `references/catalog.md` and read the
**By use case** table at the top. It is keyed by the case, not the package,
so "building a horizontal gallery with prev/next buttons and dot indicators"
is findable without knowing that swiper was the thing you were about to
reach for.

A row is a starting point, not a verdict. Take the rule id from it and read
the conditions before deciding. The site answers in markdown for one rule,
which is the live catalog rather than the snapshot in `references/catalog.md`:

```sh
curl --fail-with-body -sS https://youmightnotneed.dev/rules/<id>.md
```

The flag matters: plain `curl -sS` exits 0 on a 404, so an error page reads as
an answer. `--fail-with-body` exits non-zero and still prints the body, which
for a wrong id is a line naming the id and pointing at the index.

That carries the native approach, the Baseline tier, every condition for
keeping the dependency, the swap and the guides. The CLI gives the same
conditions without the site, and works offline once npx has fetched it:

```sh
npx -y youmightnotneed@latest --package <name> --verbose
```

If both fail, say the conditions could not be read, and stop there. A rule id
says a rule exists. The conditions are what decides, and guessing them is the
one thing this catalog exists to prevent.

## Starting from a package

The **By package** section of `references/catalog.md` maps every package the
catalog claims to the rule that covers it. Grep it for the dependency name.
That is the one lookup here that needs no network at all.

For the conditions, and for auditing a whole package.json:

```sh
npx -y youmightnotneed@latest --package axios --verbose
npx -y youmightnotneed@latest --verbose          # nearest package.json
npx -y youmightnotneed@latest ./app --json       # machine-readable
```

Nothing under "keep it if" means there is nothing to weigh. These work offline
once npx has fetched the package, and none of them sends the package.json
anywhere.

## Starting from code, with no package involved

The other two directions both begin with a package. This one does not, and it
is the larger half of the problem: a hand-written focus trap, scroll lock or
carousel installs nothing, so no package.json match can ever fire on it. The
code is the only evidence there is.

Load `references/catalog.md` and read the **By hand-rolled shape** table. It is
keyed by what the code does, so it matches against what you are reading rather
than against a dependency name. Check it whenever you are:

- about to write a UI behaviour yourself, before you write it
- reading code someone else, or an earlier session, has just written
- asked to review or clean up a component

A shape matching is a starting point, exactly like a package matching. Read the
rule's conditions before proposing anything. There is no package name here, so
`--package` cannot answer it. Use the rule id:

```sh
npx -y youmightnotneed@latest --rule <id>          # works offline
curl --fail-with-body -sS https://youmightnotneed.dev/rules/<id>.md
```

If neither works, you still know more than nothing: `references/catalog.md`
gives you the shape, the rule id and the native replacement. Report those, say
plainly that the conditions could not be read, and propose no change. An
unread condition is the one thing that turns a finding into a bad edit, so a
shape match with the conditions missing is a question for the user, never an
instruction to yourself.

Two things this table is not. It is not a list of everything worth replacing,
so code that matches nothing has not been cleared. And a hand-rolled version
that exists for one of the rule's "keep it if" reasons is the right call, so
say that rather than proposing a rewrite.

The **Already checked by a linter** table in the same file is the opposite
case: those shapes are caught mechanically today. Point at the lint rule and
move on instead of reviewing them by hand.

## What a finding actually claims

A finding is a conditional, never an instruction:

> If you are using `swiper` for a horizontal gallery with prev/next buttons and
> dot indicators, CSS scroll-snap with `::scroll-button()` and
> `::scroll-marker()` covers that case.

A dependency being in package.json is not evidence of how it is used. Someone
installs Framer Motion for layout animations, not for fade-ins. So:

- Read every "keep it if" line. One that applies means the dependency stays,
  and that is a finished answer.
- Check the Baseline tier against the project's own support target. `widely
  available` is safe, `newly available` is a decision, `limited` needs a
  fallback written before anything is swapped.
- Sizes are "up to". They assume a full replacement, which is usually not what
  a given codebase is doing.
- Never remove a dependency on a match alone. Read the call sites first.
- A finding on a hand-rolled shape is held to the same bar. The conditions
  decide, and "this was written by hand for a reason the rule lists" is a
  finished answer.
- For hand-rolled code there is no import to grep, so "read the call sites"
  becomes: is this the only copy, what else calls it, and does anything depend
  on its return value or its timing. Several shapes collapsing into one rule is
  the good case, and worth saying so.

Load `references/reading-a-finding.md` before acting on a report for the first
time, or whenever a finding is borderline.

## Writing the replacement

The catalog gives the swap in one line and stops there. A rule may list
`guides`, which are IDs from Google Chrome's modern-web-guidance and carry the
implementation, the fallbacks and the platform quirks:

```sh
npx -y modern-web-guidance@latest retrieve "<id>"
```

## Through MCP instead

`npx -y youmightnotneed-mcp` serves the same catalog over stdio, for a host
that prefers tools to a CLI.
