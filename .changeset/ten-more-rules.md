---
"@jomae/catalog": minor
---

Ten new rules, mostly JavaScript APIs rather than CSS.

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
