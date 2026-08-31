# youmightnotneed

Find the modern CSS and HTML that replaces your JavaScript dependencies.

```
npx youmightnotneed
```

Reads the nearest `package.json` and prints what the platform now covers,
grouped by how well supported the replacement is.

```
npx youmightnotneed [path] [options]

  path            A package.json, or a directory holding one.
  -v, --verbose   Print every condition where the dependency still wins.
      --json      Machine-readable output.
      --no-color  Disable colour. NO_COLOR is respected too.
  -h, --help      Show help.
```

Run it with `--verbose` before you change anything. The conditions are the
point: a dependency in `package.json` is not proof of what it is used for, so
every finding is a "this may apply", and the report says when it does not.

Powered by [`@youmightnotneed/catalog`](https://www.npmjs.com/package/@youmightnotneed/catalog).
MIT.
