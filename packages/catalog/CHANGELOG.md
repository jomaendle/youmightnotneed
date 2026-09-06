# @jomae/catalog

## 0.5.0

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

## 0.4.0

### Minor Changes

- [#34](https://github.com/jomaendle/youmightnotneed/pull/34) [`bda3c5d`](https://github.com/jomaendle/youmightnotneed/commit/bda3c5d4e2e968b6abf1656f71aa60c88b818593) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Add 13 rules using the newly broadened scope (CSS, HTML, or a Web API,
  not just CSS/HTML): `clipboard`, `web-share`, `intersection-observer`,
  `broadcast-channel`, `fullscreen`, `page-visibility`, `abort-controller`,
  `structured-clone`, `speech-synthesis`, `screen-wake-lock`,
  `web-bluetooth`, `speech-recognition`, and `line-clamp`.

- [#36](https://github.com/jomaendle/youmightnotneed/pull/36) [`b748387`](https://github.com/jomaendle/youmightnotneed/commit/b748387b7d5fe82e259f173a14619688ad80695f) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Add 5 rules: `resize-observer`, `focus-visible`, `compression-streams`,
  `relative-time`, and `drag-and-drop`. Add cross-ecosystem package aliases
  (Vue, Angular, Svelte) to 21 existing rules. Add per-feature browser
  support data (`ResolvedFeature.support`, `combinedSupport()`) so a rule
  can report the minimum Chrome, Edge, Firefox, and Safari version it needs.

- [#36](https://github.com/jomaendle/youmightnotneed/pull/36) [`b748387`](https://github.com/jomaendle/youmightnotneed/commit/b748387b7d5fe82e259f173a14619688ad80695f) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Add `number-format` rule for `Intl.NumberFormat` (currency, percent, and
  unit formatting), replacing `numeral`, `accounting`, `currency.js`, and
  `format-number`.

## 0.3.0

### Minor Changes

- [#32](https://github.com/jomaendle/youmightnotneed/pull/32) [`b2027f5`](https://github.com/jomaendle/youmightnotneed/commit/b2027f5d1106f4f01035eed76498fa878a0c2d91) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Add three rules: `content-visibility` (replaces react-window,
  react-virtualized), `resizable-panels` (replaces react-resizable-panels,
  re-resizable, react-split-pane), and `date-time-input` (replaces
  react-datepicker, flatpickr, react-flatpickr, react-day-picker).

### Patch Changes

- [#26](https://github.com/jomaendle/youmightnotneed/pull/26) [`3a04168`](https://github.com/jomaendle/youmightnotneed/commit/3a041686be88eb92e58eca371592c2cb30ed525d) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Point the npm package listing and CLI output at the live Vercel deployment
  instead of `youmightnotneed.dev`, which isn't wired up yet. `homepage` in
  both package.json files, the catalog README, and the CLI's "Details and
  live demos" footer line now point to
  `https://youmightnotneed-web.vercel.app`.

## 0.2.0

### Minor Changes

- [#7](https://github.com/jomaendle/youmightnotneed/pull/7) [`c96979f`](https://github.com/jomaendle/youmightnotneed/commit/c96979f39d6f345af10de190d2fa0ee16f94dfaa) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Add a rule for lazy-loaded images and iframes. Replaces lozad, lazysizes,
  vanilla-lazyload, react-lazyload, react-lazy-load-image-component and
  yall-js with the native `loading="lazy"` attribute.
