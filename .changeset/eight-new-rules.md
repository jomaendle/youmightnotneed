---
"@jomae/catalog": minor
"youmightnotneed-mcp": patch
---

Eight new rules, taking the catalog to 64.

Baseline widely available: `web-locks` (async-mutex, await-lock, mutexify,
p-mutex), `intl-display-names` (i18n-iso-countries, country-list, iso-639-1),
`intl-list-format` (humanize-list) and `web-animations` (animejs, popmotion,
velocity-animate).

Baseline newly available: `intl-segmenter` (graphemer, grapheme-splitter,
string-length, lodash.words, split-graphemes), `urlpattern` (path-to-regexp,
url-pattern, route-parser), `promise-withresolvers` (p-defer, defer-promise)
and `abortsignal-timeout` (p-timeout, promise-timeout).

Each one has a live demo on the site.

The MCP server now writes a short hint to stderr when it is started from a
terminal with no client attached. It speaks stdio, so running it by hand
printed nothing and looked like a crash. stdout stays the protocol channel and
is untouched.
