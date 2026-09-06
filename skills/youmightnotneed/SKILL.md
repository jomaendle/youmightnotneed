---
name: youmightnotneed
description: Check whether a JavaScript dependency has a native CSS, HTML or Web API equivalent, before adding it or while auditing what is already installed. Use when about to install a frontend package, when asked whether a library is still needed, when reviewing a package.json for weight, or when picking between a library and a platform feature for carousels, dialogs, tooltips, popovers, scroll effects, transitions, date pickers, drag and drop, clipboard, or text truncation.
---

# youmightnotneed

A lookup table from npm package names to the platform feature that covers the
same case. It matches exact dependency names against a catalog of 46 rules, so
there is no model in the loop and no guessing about what a package does.

## Before adding a frontend dependency

```sh
npx -y youmightnotneed@latest --package <name> --verbose
```

Nothing printed under "keep it if" means nothing to weigh. If a rule fires,
read those conditions before deciding. They are the point of the tool.

## Auditing a project

```sh
npx -y youmightnotneed@latest --verbose          # nearest package.json
npx -y youmightnotneed@latest ./app --json       # machine-readable
```

Both work offline once npx has the package, and neither sends the
package.json anywhere.

## What a finding actually claims

A finding is a conditional, never an instruction:

> If you are using `swiper` for a horizontal gallery with prev/next buttons and
> dot indicators, CSS scroll-snap with `::scroll-button()` and
> `::scroll-marker()` covers that case.

A dependency being in package.json is not evidence of how it is used. Someone
installs Framer Motion for layout animations, not for fade-ins. So:

- Read every "keep it if" line. One that applies means the dependency stays,
  and that is a finished answer, not a failure.
- Check the Baseline tier against the project's own support target. `widely
  available` is safe, `newly available` is a decision, `limited` needs a
  fallback written before anything is swapped.
- Sizes are "up to". They assume a full replacement, which is usually not what
  a given codebase is doing.
- Never remove a dependency on a match alone. Read the call sites first.

Load `references/reading-a-finding.md` before acting on a report for the first
time, or whenever a finding is borderline.

## Writing the replacement

The catalog gives the swap in one line and stops there. A finding may list
`guides`, which are IDs from Google Chrome's modern-web-guidance and carry the
implementation, the fallbacks and the platform quirks:

```sh
npx -y modern-web-guidance@latest retrieve "<id>"
```

## Looking something up without running anything

`references/catalog.md` lists every rule, the packages it claims, its support
tier and its guide IDs. Load it when checking several packages at once, or
when there is no shell available.

## Through MCP instead

`npx -y youmightnotneed-mcp` serves the same catalog over stdio with three
tools: `analyze_dependencies` takes a dependency map, `get_rule` takes an id
or a package name, and `list_rules` returns every rule in summary form. The
data is identical, because all four surfaces call one pure `detect()`.
