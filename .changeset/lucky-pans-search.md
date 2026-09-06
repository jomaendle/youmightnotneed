---
"@jomae/catalog": minor
---

Add `searchRules()`, a free-text lookup over the catalog. `detect()` needs a
whole package.json; this answers the question someone arrives with instead, a
single package name or feature. Exact package matches rank above prefix and
substring hits, and a rule can also be found by its title or its native
feature. It returns which package names the query matched, so a surface can
show them.
