---
"@jomae/catalog": patch
"youmightnotneed": patch
"youmightnotneed-mcp": patch
---

Point at youmightnotneed.dev. The site has its own domain now, so `homepage`
on all three packages, the URL the CLI prints under a report, and the README
links go there instead of at the Vercel deployment URL. The old URL is still
attached and still resolves, so existing links keep working.
