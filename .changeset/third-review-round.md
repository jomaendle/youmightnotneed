---
"@jomae/catalog": patch
"youmightnotneed": patch
"youmightnotneed-mcp": patch
---

Fixes from a third review pass, across the scripts, the surfaces and the demos.

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
