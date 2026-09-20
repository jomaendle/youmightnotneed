---
"@jomae/catalog": patch
"youmightnotneed": patch
"youmightnotneed-mcp": patch
---

Fix the crossing date a rule reports

baselineSince dated each feature against that feature's own tier, so a newly
available rule that also needed an already-widely feature was dated by when
that feature reached widely. light-dark read 2024-08-03 instead of
2024-05-13, and a --since window in between listed it wrongly. The wrong date
also shipped in CLI --json and the MCP since field.

Also: an empty --since view no longer claims the window did the filtering
when the package had no rule at all, and a single undated finding reads "1
has" rather than "1 have".
