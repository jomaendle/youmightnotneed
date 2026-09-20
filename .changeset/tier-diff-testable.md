---
"@jomae/catalog": minor
---

Make the tier comparison testable, and stop it dropping renamed features

The tier-change report skipped any feature present in the committed snapshot
but absent upstream, which is exactly what a rename looks like and the one
case most needing a person. It now reports those separately.

The comparison moved to `packages/catalog/src/tier-diff.ts` as a pure
`diffTiers`, where the test machinery reaches.
