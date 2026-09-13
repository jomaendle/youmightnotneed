---
"@jomae/catalog": minor
"youmightnotneed": patch
"youmightnotneed-mcp": patch
---

Hand-rolled shapes widened from 10 rules to 35, and corrected.

Ten rules was too thin to test the idea that hand-written platform behaviour
is the larger half of what a dependency scan misses, so 27 more carry shapes
now, 56 in total.

Three reviews then found how much of the widening was wrong. Six shapes
described work the rule's own `unless` says the native feature does not do:
`inert` listed storing `activeElement`, which its conditions say inert does not
track and you still write yourself. A shape like that tells an agent a rule
applies to code the rule cannot replace, which reads as confident and is
exactly backwards. Nine more were loose enough to match ordinary unrelated
code. All are fixed or gone.

`intersection-observer`, `resize-observer` and `abortsignal-timeout` now name
their lint rules, taking the total to eight. `unicorn/prefer-observer-apis` was
already in the committed snapshot and matched two rules' shapes word for word,
which is the third time this work proposed prose where a linter already
existed.

`lintRule` and `handRolled` may now appear on the same rule.
`resize-observer` is why: the resize listener is matched by a linter and the
interval polling is not, and losing either is worse than the risk they
disagree.

The CLI no longer exits 0 when `--rule` is combined with `--version`, which
silently dropped the rule that was asked for. Lockfiles are refused by name, so
pointing at `pnpm-lock.yaml` or `yarn.lock` says it is a lockfile rather than
reporting invalid JSON.

The MCP tool descriptions now mention the hand-rolled shape index and the
resolved lint rule, which were returned but undiscoverable from `tools/list`.
