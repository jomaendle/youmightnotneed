---
"@jomae/catalog": minor
"youmightnotneed": minor
"youmightnotneed-mcp": minor
---

Answer "what became replaceable recently" with `--since`

The catalog already knew when each native replacement reached its current
Baseline status, but nothing exposed it. `youmightnotneed --since 2026-03-01`
now narrows a report to the rules that crossed on or after a date, and names
what it held back rather than letting it vanish.

Put the date in a package.json script and bump it when you read the report,
and each run covers the platform's moves since the last one.

The catalog gains `baselineSince()` and `splitSince()`, both pure. CLI `--json`
carries `baseline.since` on every finding, and the MCP server carries `since`
on each finding from `analyze_dependencies`, so an agent can answer the same
question by filtering what it already has.
