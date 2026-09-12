---
"@jomae/catalog": minor
---

Add `renderRuleMarkdown()`, `renderUseCaseTable()` and `ruleMarkdownUrl()`, the
markdown projection of the catalog. The rendering used to live in
`scripts/build-skill.ts`, where only the skill generator could reach it, so the
website now serves the same bytes at `/rules/<id>.md` and `/llms.txt`. A rule
renders with its `unless` conditions in full, which until now were reachable
only through the CLI's `--verbose` or the MCP server, and with the guides that
carry the implementation.

The skill's generated reference is restructured rather than only extended.
The per-rule listing is gone, replaced by a package index that keeps the
offline package lookup in one line per rule instead of a block, so the file
holds both directions in a fraction of the length.

`height-auto-animation` also gains the `calculate-with-intrinsic-sizes` guide.
The rule names `calc-size()` as one of its two native approaches and that guide
is the one that covers it.
