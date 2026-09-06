# youmightnotneed-mcp

## 0.2.0

### Minor Changes

- [#38](https://github.com/jomaendle/youmightnotneed/pull/38) [`068123b`](https://github.com/jomaendle/youmightnotneed/commit/068123b216230e7c0ef4353d78e9cd1f120e0fd8) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Rule categories, and a record of how Baseline support moves.
  
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

### Patch Changes

- Updated dependencies [[`068123b`](https://github.com/jomaendle/youmightnotneed/commit/068123b216230e7c0ef4353d78e9cd1f120e0fd8)]:
  - @jomae/catalog@0.5.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`bda3c5d`](https://github.com/jomaendle/youmightnotneed/commit/bda3c5d4e2e968b6abf1656f71aa60c88b818593), [`b748387`](https://github.com/jomaendle/youmightnotneed/commit/b748387b7d5fe82e259f173a14619688ad80695f), [`b748387`](https://github.com/jomaendle/youmightnotneed/commit/b748387b7d5fe82e259f173a14619688ad80695f)]:
  - @jomae/catalog@0.4.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`b2027f5`](https://github.com/jomaendle/youmightnotneed/commit/b2027f5d1106f4f01035eed76498fa878a0c2d91), [`3a04168`](https://github.com/jomaendle/youmightnotneed/commit/3a041686be88eb92e58eca371592c2cb30ed525d)]:
  - @jomae/catalog@0.3.0
