# youmightnotneed

Find the CSS, HTML, or Web API that replaces your JavaScript dependencies.

```
npx youmightnotneed
```

`npx` works whether or not the package is installed. It resolves a local
`node_modules/.bin` copy first. The bare `youmightnotneed` command only
works after a global install.

Reads the nearest `package.json` and prints what the platform now covers,
grouped by how well supported the replacement is.

```
npx youmightnotneed [path] [options]

  path            A package.json, or a directory holding one.
  -p, --package   Check one npm package by name instead of reading a
                  package.json. Use it before you install something.
  -v, --verbose   Print every condition where the dependency still wins.
      --json      Machine-readable output, with provenance for the data.
      --no-color  Disable colour. NO_COLOR is respected too.
  -h, --help      Show help.
      --version   Print the version.
```

Before adding a dependency, check whether the platform already covers it:

```
npx youmightnotneed --package axios --verbose
```

Run it with `--verbose` before you change anything. The conditions are the
point: a dependency in `package.json` is not proof of what it is used for, so
every finding is a "this may apply", and the report says when it does not.

Powered by [`@jomae/catalog`](https://www.npmjs.com/package/@jomae/catalog).
MIT.
