---
"@jomae/catalog": minor
"youmightnotneed": patch
"youmightnotneed-mcp": patch
---

Correctness fixes from a second review pass over the whole codebase.

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
