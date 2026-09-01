---
"youmightnotneed": patch
"@jomae/catalog": patch
---

Point the npm package listing and CLI output at the live Vercel deployment
instead of `youmightnotneed.dev`, which isn't wired up yet. `homepage` in
both package.json files, the catalog README, and the CLI's "Details and
live demos" footer line now point to
`https://youmightnotneed-web.vercel.app`.
