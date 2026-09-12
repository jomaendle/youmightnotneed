# @jomae/catalog

## 0.7.0

### Minor Changes

- [#41](https://github.com/jomaendle/youmightnotneed/pull/41) [`8e0e45f`](https://github.com/jomaendle/youmightnotneed/commit/8e0e45fd828ce7812223f54fd9db2ffa14e63c14) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Add `searchRules()`, a free-text lookup over the catalog. `detect()` needs a
  whole package.json; this answers the question someone arrives with instead, a
  single package name or feature. Exact package matches rank above prefix and
  substring hits, and a rule can also be found by its title or its native
  feature. It returns which package names the query matched, so a surface can
  show them.

- [#47](https://github.com/jomaendle/youmightnotneed/pull/47) [`aa13213`](https://github.com/jomaendle/youmightnotneed/commit/aa132135d0aeecd6edbc232d80615604d6b54085) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Add `renderRuleMarkdown()`, `renderUseCaseTable()` and `ruleMarkdownUrl()`, the
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

### Patch Changes

- [#44](https://github.com/jomaendle/youmightnotneed/pull/44) [`901eef7`](https://github.com/jomaendle/youmightnotneed/commit/901eef728cf9294d10fb8be73aaa719da3ecd18b) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Point at youmightnotneed.dev. The site has its own domain now, so `homepage`
  on all three packages, the URL the CLI prints under a report, and the README
  links go there instead of at the Vercel deployment URL. The old URL is still
  attached and still resolves, so existing links keep working.

## 0.6.0

### Minor Changes

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

- [#37](https://github.com/jomaendle/youmightnotneed/pull/37) [`9e0c0a2`](https://github.com/jomaendle/youmightnotneed/commit/9e0c0a257391b33e7d4d247a54a2877020fc2277) Thanks [@jomaendle](https://github.com/jomaendle)! - Ten new rules, mostly JavaScript APIs rather than CSS.
  
  `fetch()` for axios and the fetch polyfills, `crypto.randomUUID()` for uuid,
  `URLSearchParams` for query-string and qs, `crypto.subtle` for crypto-js,
  `EventTarget` with `CustomEvent` for mitt and the other emitters,
  `Intl.DurationFormat` for pretty-ms and humanize-duration, `Object.groupBy()`
  for lodash.groupby, `btoa`/`atob` with `TextEncoder` for js-base64,
  `Intl.Collator` for natural-compare, and `EventSource` for the eventsource
  client.
  
  Six existing rules also pick up the polyfill packages they supersede:
  dialog-polyfill, @oddbird/popover-polyfill, clipboard-polyfill,
  intersection-observer, abortcontroller-polyfill, and clone-deep, fast-copy
  and just-clone on the deep cloning rule.
  
  The catalog now covers 252 packages across 56 rules.

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

- [#37](https://github.com/jomaendle/youmightnotneed/pull/37) [`801a1b0`](https://github.com/jomaendle/youmightnotneed/commit/801a1b02bcdea11d224253bc8f2cf452f5824f19) Thanks [@jomaendle](https://github.com/jomaendle)! - Six more guide references, found by auditing the whole upstream index.
  
  The view transitions rule replaces libraries whose selling point is directional
  page slides and list reordering, and modern-web-guidance covers both:
  `directional-navigation-transitions`, `group-element-transitions` and
  `consistent-cross-document-transitions`. The discrete transitions rule replaces
  react-spring, and `physics-based-easing` is the guide for building a spring
  with `linear()`; `dynamic-sibling-animations` covers the stagger that comes
  with it. The carousel rule gains `scroll-snap-realtime-feedback`, which is
  `scrollsnapchanging` during the gesture, where the guide it already carried is
  `scrollsnapchange` after it settles.
  
  Each was read before it was linked, and all 49 guide references now point at
  files that exist upstream.

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

- [#37](https://github.com/jomaendle/youmightnotneed/pull/37) [`c41c7f2`](https://github.com/jomaendle/youmightnotneed/commit/c41c7f20967fcfa0d8341d263daf9c0806479e59) Thanks [@jomaendle](https://github.com/jomaendle)! - Browser versions in rule prose now come from the source data, never from a
  maintainer's memory.
  
  A rule used to write "below Chrome 92, Firefox 95 or Safari 15.4" as plain
  text. A review found seven rules whose numbers the source data contradicts,
  every one of them in the direction that tells a reader a feature is safe when
  it is not. Fixing those numbers would have left the mechanism that produced
  them in place.
  
  So a rule now writes `{{safari:api.Crypto.randomUUID}}` and never a number.
  `pnpm refresh:support` resolves every token from `web-features`, or from MDN's
  browser-compat-data where the claim is finer than web-features rolls up, and
  commits the result alongside the Baseline and size snapshots. Resolution
  happens once where the rules are exported, so the website, the CLI, the MCP
  server and the agent skill all read finished prose.
  
  Three gates hold it: a token no source can confirm fails the refresh rather
  than shipping a guess, a committed number that stops matching its source fails
  `check:freshness`, and a literal browser version anywhere in a rule file fails
  the tests.
  
  Resolving the existing 36 claims corrected one more error nobody had caught:
  `URLSearchParams` reached Firefox 29, not the 44 the prose claimed.

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
