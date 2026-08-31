---
"youmightnotneed": patch
---

Fix a bug where any path not literally named `package.json` was
misread as a directory. `npx youmightnotneed ./some-other-name.json`
now reads that file directly instead of failing with "No package.json
at ./some-other-name.json/package.json".
