# youmightnotneed-mcp

## 0.3.0

### Minor Changes

- [#37](https://github.com/jomaendle/youmightnotneed/pull/37) [`8f39075`](https://github.com/jomaendle/youmightnotneed/commit/8f3907508bdd3c68a39f0303df7558c7cc020dfa) Thanks [@jomaendle](https://github.com/jomaendle)! - Point rules at long-form guides, add two rules, and check one package at a time.
  
  A rule can now carry `guides`: IDs of GoogleChrome/modern-web-guidance guides
  that cover the implementation this catalog leaves out. Their guides are keyed
  by use case and ours by package name, so the two meet without overlapping.
  Only IDs are stored. `pnpm refresh:guides` snapshots their index from the
  published npm package, and a rule pointing at a guide that no longer exists
  fails the freshness check instead of shipping as a dead link. 23 rules carry
  guides today, and the CLI, the MCP server and the website all surface them.
  
  Two new rules: the `inert` attribute for `focus-trap` and friends, and the CSS
  Custom Highlight API for `mark.js` and friends.
  
  The CLI takes `--package <name>`, which checks one npm package without
  reading a package.json. Useful before installing something.

### Patch Changes

- [#37](https://github.com/jomaendle/youmightnotneed/pull/37) [`38266f6`](https://github.com/jomaendle/youmightnotneed/commit/38266f6728d512b5939b1270f94a797bff84984a) Thanks [@jomaendle](https://github.com/jomaendle)! - Show the versions a feature has when web-features publishes none for the whole.
  
  The anchor positioning rule page showed a dash for Chrome, Edge, Firefox and
  Safari, which reads as "no engine has this". The truth is Chrome 125, Edge
  125, Firefox 147 and Safari 26, and the same page printed those numbers a few
  paragraphs down in its conditions.
  
  The cause is that web-features gives a feature no aggregate `support` unless
  the whole feature is Baseline. Anchor positioning has 325 compat keys, 319 of
  them Baseline since 2026-01-13, and six that are not, so it reports
  `support: {}`. A snapshot that stored only the aggregate had nothing to show.
  
  A feature with no aggregate now names one compat key that stands in for it,
  and the versions come from web-features' own `by_compat_key`. Nothing is
  computed across keys and no version is typed by hand: if a feature loses its
  aggregate and no stand-in is named, `pnpm refresh:baseline` fails instead of
  writing a row of dashes. The page shows the numbers with the part named next
  to them, and a rule whose parts have no versions either says that rather than
  implying nothing supports it.
  
  Three features were affected: anchor positioning, `::scroll-button` (Chrome
  and Edge 135) and masonry, which genuinely has no version data anywhere.

- [#37](https://github.com/jomaendle/youmightnotneed/pull/37) [`b628ed1`](https://github.com/jomaendle/youmightnotneed/commit/b628ed1c9d21e5783d8872ebb362016eeffbe3b2) Thanks [@jomaendle](https://github.com/jomaendle)! - Correctness fixes from a second review pass over the whole codebase.
  
  **The CLI could emit invalid JSON.** `main()` called `process.exit(0)` straight
  after writing, and stdout to a pipe is asynchronous in Node, so
  `npx youmightnotneed --json | jq` on a large project silently truncated at the
  64 KiB pipe buffer and still exited 0. Returning instead of exiting lets Node
  flush. `--json` now also carries the provenance the human footer prints, plus
  each match's measured version and each guide's retrieval command.
  
  **Three rules published a browser support floor lower than the truth**, because
  they read a `web-features` ID coarser than the API they recommend. `resolveFeature`
  and `readSize` both indexed their generated snapshot directly, so a feature ID
  or a package named `constructor` resolved off `Object.prototype`: the first
  badged a rule "limited availability" with a fabricated feature name, the second
  reported a confident 0 bytes instead of an unknown size.
  
  **Corrected support claims in seven rules**, all verified against
  `web-features` or browser-compat-data: content-visibility named Safari 18
  where `auto` needs Safari 26; text-box-trim said "outside Chromium"
  when Safari has shipped it since 18.2; scroll-driven animations and
  field-sizing both named Safari as missing when it ships them; screen-wake-lock
  omitted that iOS only got it in 18.4; resizable-panels omitted that iOS Safari
  has no `resize` at all; and the fetch rule named the wrong Chrome version for
  `AbortSignal.timeout()`. The speech-recognition snippet threw a `ReferenceError`
  in Safari and in Chrome below 139, and now reads the constructor off `window`.
  
  **`detect()` reads `optionalDependencies`**, which npm installs and bundles
  like any other field.
  
  **The schema was accepting data it documents as invalid**: an impossible
  `verifiedOn` date such as `2026-99-99` (which made a hand-verified claim
  unable to ever expire), a `manualBaseline` alongside `featureIds` (silently
  discarded), duplicate or malformed feature IDs, and `javascript:` URLs.

- [#37](https://github.com/jomaendle/youmightnotneed/pull/37) [`97f4615`](https://github.com/jomaendle/youmightnotneed/commit/97f461574baf574142fb5de4f48f2a7b74383c9e) Thanks [@jomaendle](https://github.com/jomaendle)! - Fixes from a third review pass, across the scripts, the surfaces and the demos.
  
  **The hand-verified rules explained themselves to nobody.** Four rules set
  their tier by hand, each with a note saying which `web-features` ID was
  rejected and why. Nothing rendered it. The rule page now shows the note under
  the badge, and `--json` carries it, so "verified by hand" comes with its
  reasoning instead of asking for trust.
  
  **The catalog sidebar counted the whole catalog.** Picking a category left the
  tier counts claiming catalog-wide totals beside a list showing a fraction of
  them. Every row now carries one count per state of the other filter and CSS
  reveals the matching one, so the numbers narrow as the reader does. Still no
  JavaScript.
  
  **Two demos overstated what they had shown.** The `inert` demo trapped nothing
  in a browser without `inert` and said nothing about it, and left focus on a
  hidden button when the panel closed. The `event-target` demo announced that
  `abort()` had removed both listeners rather than demonstrating it; it now
  counts the listeners that ran and reports what it measured.
  
  **A repo name with an emoji lost its last character.** Permalink labels were
  capped with a UTF-16 slice, which cuts a surrogate pair in half and encodes
  the remaining half as a replacement character. Labels are now capped by code
  point.
  
  **The refresh workflow updated one of its two sources.** `web-features` was
  pulled to latest, `@mdn/browser-compat-data` was not, so the member-level
  versions behind every `{{browser:...}}` claim came from whatever was in the
  lockfile. It now updates both, and a bundlephobia outage no longer discards a
  good Baseline refresh.
- Updated dependencies [[`38266f6`](https://github.com/jomaendle/youmightnotneed/commit/38266f6728d512b5939b1270f94a797bff84984a), [`b628ed1`](https://github.com/jomaendle/youmightnotneed/commit/b628ed1c9d21e5783d8872ebb362016eeffbe3b2), [`801a1b0`](https://github.com/jomaendle/youmightnotneed/commit/801a1b02bcdea11d224253bc8f2cf452f5824f19), [`9e0c0a2`](https://github.com/jomaendle/youmightnotneed/commit/9e0c0a257391b33e7d4d247a54a2877020fc2277), [`97f4615`](https://github.com/jomaendle/youmightnotneed/commit/97f461574baf574142fb5de4f48f2a7b74383c9e), [`c41c7f2`](https://github.com/jomaendle/youmightnotneed/commit/c41c7f20967fcfa0d8341d263daf9c0806479e59), [`8f39075`](https://github.com/jomaendle/youmightnotneed/commit/8f3907508bdd3c68a39f0303df7558c7cc020dfa)]:
  - @jomae/catalog@0.6.0

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
