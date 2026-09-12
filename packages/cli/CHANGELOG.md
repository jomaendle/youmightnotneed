# youmightnotneed

## 0.3.0

### Minor Changes

- [#52](https://github.com/jomaendle/youmightnotneed/pull/52) [`c910ed8`](https://github.com/jomaendle/youmightnotneed/commit/c910ed88b81b2f5dc6f22d3546070824d2a47f01) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Two new rule fields, for the half of the problem a package.json cannot show.
  
  `agent.handRolled` describes the shapes people write by hand instead of using
  the native feature: a keydown handler cycling tabbable elements, a scroll
  listener dividing scrollLeft by item width, `body.style.overflow = "hidden"`.
  Nothing is installed for any of it, so no dependency scan ever fires. Ten rules
  carry these to start, 26 shapes in all.
  
  `lintRule` names a lint rule that already checks a shape, rather than this
  catalog growing a second implementation of the same check. Five rules point at
  eslint-plugin-unicorn. The names are snapshotted by `pnpm refresh:lint-rules`
  and verified by `check:freshness`, so a rule renamed upstream fails the build
  instead of shipping as a dead link. All five were confirmed to actually fire on
  the shapes claimed.
  
  The split is the useful part: a rule is either mechanically checkable today or
  it needs a person, and knowing which is most of deciding how to tackle it. The
  new /checks page says which is which, with a config to paste.
  
  The CLI gains `--rule <id>`, which prints one rule in full. It is the offline
  route for a hand-rolled shape, where there is no package name to pass to
  `--package`. `--verbose` now names the lint rule under a finding.
  
  The MCP server returns the resolved lint rule from `get_rule`, and `list_rules`
  returns every hand-rolled shape in one call so an agent holding code rather
  than a dependency list has the whole checklist.
  
  The agent skill gains a third direction, "starting from code you are about to
  write or just read", and the generated reference gains a table keyed by shape.

### Patch Changes

- Updated dependencies [[`c910ed8`](https://github.com/jomaendle/youmightnotneed/commit/c910ed88b81b2f5dc6f22d3546070824d2a47f01)]:
  - @jomae/catalog@0.9.0

## 0.2.2

### Patch Changes

- Updated dependencies [[`2e37ee6`](https://github.com/jomaendle/youmightnotneed/commit/2e37ee64c261178d3061777e76f6c34838bdbca1)]:
  - @jomae/catalog@0.8.0

## 0.2.1

### Patch Changes

- [#44](https://github.com/jomaendle/youmightnotneed/pull/44) [`901eef7`](https://github.com/jomaendle/youmightnotneed/commit/901eef728cf9294d10fb8be73aaa719da3ecd18b) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Point at youmightnotneed.dev. The site has its own domain now, so `homepage`
  on all three packages, the URL the CLI prints under a report, and the README
  links go there instead of at the Vercel deployment URL. The old URL is still
  attached and still resolves, so existing links keep working.
- Updated dependencies [[`8e0e45f`](https://github.com/jomaendle/youmightnotneed/commit/8e0e45fd828ce7812223f54fd9db2ffa14e63c14), [`aa13213`](https://github.com/jomaendle/youmightnotneed/commit/aa132135d0aeecd6edbc232d80615604d6b54085), [`901eef7`](https://github.com/jomaendle/youmightnotneed/commit/901eef728cf9294d10fb8be73aaa719da3ecd18b)]:
  - @jomae/catalog@0.7.0

## 0.2.0

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

## 0.1.6

### Patch Changes

- Updated dependencies [[`068123b`](https://github.com/jomaendle/youmightnotneed/commit/068123b216230e7c0ef4353d78e9cd1f120e0fd8)]:
  - @jomae/catalog@0.5.0

## 0.1.5

### Patch Changes

- Updated dependencies [[`bda3c5d`](https://github.com/jomaendle/youmightnotneed/commit/bda3c5d4e2e968b6abf1656f71aa60c88b818593), [`b748387`](https://github.com/jomaendle/youmightnotneed/commit/b748387b7d5fe82e259f173a14619688ad80695f), [`b748387`](https://github.com/jomaendle/youmightnotneed/commit/b748387b7d5fe82e259f173a14619688ad80695f)]:
  - @jomae/catalog@0.4.0

## 0.1.4

### Patch Changes

- [#26](https://github.com/jomaendle/youmightnotneed/pull/26) [`3a04168`](https://github.com/jomaendle/youmightnotneed/commit/3a041686be88eb92e58eca371592c2cb30ed525d) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Point the npm package listing and CLI output at the live Vercel deployment
  instead of `youmightnotneed.dev`, which isn't wired up yet. `homepage` in
  both package.json files, the catalog README, and the CLI's "Details and
  live demos" footer line now point to
  `https://youmightnotneed-web.vercel.app`.
- Updated dependencies [[`b2027f5`](https://github.com/jomaendle/youmightnotneed/commit/b2027f5d1106f4f01035eed76498fa878a0c2d91), [`3a04168`](https://github.com/jomaendle/youmightnotneed/commit/3a041686be88eb92e58eca371592c2cb30ed525d)]:
  - @jomae/catalog@0.3.0

## 0.1.3

### Patch Changes

- [#23](https://github.com/jomaendle/youmightnotneed/pull/23) [`508d535`](https://github.com/jomaendle/youmightnotneed/commit/508d5356eb2bf26a54cb6bdcefef9463d2ebfc65) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Fix the CLI printing nothing and exiting 0 for every invocation, including
  `--help` and unknown flags. `npm`/`npx` always run a package's bin through a
  symlink in `node_modules/.bin`, and the entry-point check added in [#9](https://github.com/jomaendle/youmightnotneed/issues/9)
  compared `import.meta.url` (dereferenced by Node) against the un-dereferenced
  symlink path, so the two could never match and `main()` never ran. Both
  `youmightnotneed@0.1.1` and `0.1.2` were affected. The check now resolves
  the symlink with `realpathSync()` before comparing.

## 0.1.2

### Patch Changes

- [#9](https://github.com/jomaendle/youmightnotneed/pull/9) [`0fee1f7`](https://github.com/jomaendle/youmightnotneed/commit/0fee1f769fe1910a6f6626428aa2ee626ef81fb3) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Fix a bug where any path not literally named `package.json` was
  misread as a directory. `npx youmightnotneed ./some-other-name.json`
  now reads that file directly instead of failing with "No package.json
  at ./some-other-name.json/package.json".

## 0.1.1

### Patch Changes

- Updated dependencies [[`c96979f`](https://github.com/jomaendle/youmightnotneed/commit/c96979f39d6f345af10de190d2fa0ee16f94dfaa)]:
  - @jomae/catalog@0.2.0
