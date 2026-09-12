---
"@jomae/catalog": minor
"youmightnotneed": minor
"youmightnotneed-mcp": minor
---

Two new rule fields, for the half of the problem a package.json cannot show.

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
