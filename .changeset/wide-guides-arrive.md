---
"@jomae/catalog": minor
"youmightnotneed": minor
"youmightnotneed-mcp": minor
---

Point rules at long-form guides, add two rules, and check one package at a time.

A rule can now carry `guides`: IDs of GoogleChrome/modern-web-guidance guides
that cover the implementation this catalog leaves out. Their guides are keyed
by use case and ours by package name, so the two meet without overlapping.
Only IDs are stored. `pnpm refresh:guides` snapshots their index from the
published npm package, and a rule pointing at a guide that no longer exists
fails the freshness check instead of shipping as a dead link. 21 rules carry
guides today, and the CLI, the MCP server and the website all surface them.

Two new rules: the `inert` attribute for `focus-trap` and friends, and the CSS
Custom Highlight API for `mark.js` and friends.

The CLI takes `--package <name>`, which checks one npm package without
reading a package.json. Useful before installing something.
