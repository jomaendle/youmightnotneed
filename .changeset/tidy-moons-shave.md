---
"@jomae/catalog": minor
---

Give three rules something an agent can match on

fetch, web-crypto and field-sizing carried no handRolled shapes, so they only
fired when the exact package name appeared in a package.json. Hand-written
code installs nothing, which is the half `replaces` cannot see.

Also adds css-element-queries to container-queries, alongside the
element-resize-detector entry it sits next to.
