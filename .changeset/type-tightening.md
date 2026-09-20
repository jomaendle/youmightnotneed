---
"@jomae/catalog": minor
---

Remove the collapsed `since` field and make `TierChange` a discriminated union

`ResolvedFeature` carried `since` alongside the `lowDate`/`highDate` it was
derived from, so a hand-built one could hold three fields that disagreed.
Reading the collapsed field instead of the raw dates is the bug that had
light-dark four months late. `featureSince(feature)` is now the one
derivation.

`TierChange.to` was null only when `direction === "missing"`, an invariant
the type did not express, so the only consumer carried a null branch it
could never reach.
