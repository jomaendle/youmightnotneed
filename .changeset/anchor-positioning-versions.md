---
"@jomae/catalog": patch
"youmightnotneed-mcp": patch
---

Show the versions a feature has when web-features publishes none for the whole.

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
