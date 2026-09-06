---
"@jomae/catalog": minor
"youmightnotneed-mcp": minor
---

Rule categories, and a record of how Baseline support moves.

Every rule now carries a `category`, one of eight in
`packages/catalog/src/categories.ts`: layout, scrolling, animation,
typography, forms, device APIs, async and observers, and formatting. The
field is required, so a rule cannot land without one, and `CategoryId` is a
closed union rather than a string, which means a typo fails to compile
rather than at runtime. A category is editorial, picked by hand like
`title`, not derived the way Baseline status is. `CATEGORIES`,
`CATEGORIES_BY_ID`, `categorySchema` and `CategoryId` are exported.

Note for anyone building a `Rule` by hand: the new field is required, so
existing code that constructs one needs updating. Reading rules from the
catalog is unaffected.

The catalog also starts recording its own Baseline history.
`pnpm refresh:baseline` now appends one entry per calendar month to
`generated/baseline-history.ts`, updating in place when it runs twice in the
same month. Each entry stores the per-rule tier tally alongside the rule
count, and `tierShareOf()` turns that into each tier's share of the catalog,
so adding rules does not read as support getting worse. Tracking starts from
the first run: there is no attempt to reconstruct earlier months.
`baselineHistory` and `tierShareOf` are exported.

The MCP server's `get_rule` returns the whole rule, so its output now
includes `category`. `list_rules` and its other tools are unchanged.
