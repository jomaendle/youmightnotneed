# youmightnotneed

## 0.1.3

### Patch Changes

- [#23](https://github.com/jomaendle/youmightnotneed/pull/23) [`508d535`](https://github.com/jomaendle/youmightnotneed/commit/508d5356eb2bf26a54cb6bdcefef9463d2ebfc65) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Fix the CLI printing nothing and exiting 0 for every invocation, including
  `--help` and unknown flags. `npm`/`npx` always run a package's bin through a
  symlink in `node_modules/.bin`, and the entry-point check added in [#9](https://github.com/jomaendle/youmightnotneed/issues/9)
  compared `import.meta.url` (dereferenced by Node) against the un-dereferenced
  symlink path, so the two could never match and `main()` never ran. Both
  `youmightnotneed@0.1.1` and `0.1.2` were affected. The check now resolves
  the symlink with `realpathSync()` before comparing.

## 0.1.2

### Patch Changes

- [#9](https://github.com/jomaendle/youmightnotneed/pull/9) [`0fee1f7`](https://github.com/jomaendle/youmightnotneed/commit/0fee1f769fe1910a6f6626428aa2ee626ef81fb3) Thanks [@jomaendle2](https://github.com/jomaendle2)! - Fix a bug where any path not literally named `package.json` was
  misread as a directory. `npx youmightnotneed ./some-other-name.json`
  now reads that file directly instead of failing with "No package.json
  at ./some-other-name.json/package.json".

## 0.1.1

### Patch Changes

- Updated dependencies [[`c96979f`](https://github.com/jomaendle/youmightnotneed/commit/c96979f39d6f345af10de190d2fa0ee16f94dfaa)]:
  - @jomae/catalog@0.2.0
