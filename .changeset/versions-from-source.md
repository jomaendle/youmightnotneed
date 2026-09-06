---
"@jomae/catalog": patch
---

Browser versions in rule prose now come from the source data, never from a
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
