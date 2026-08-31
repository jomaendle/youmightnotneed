---
"youmightnotneed": patch
---

Fix the CLI printing nothing and exiting 0 for every invocation, including
`--help` and unknown flags. `npm`/`npx` always run a package's bin through a
symlink in `node_modules/.bin`, and the entry-point check added in #9
compared `import.meta.url` (dereferenced by Node) against the un-dereferenced
symlink path, so the two could never match and `main()` never ran. Both
`youmightnotneed@0.1.1` and `0.1.2` were affected. The check now resolves
the symlink with `realpathSync()` before comparing.
