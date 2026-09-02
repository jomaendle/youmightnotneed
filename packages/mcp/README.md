# youmightnotneed-mcp

An MCP server that gives an agent direct access to the youmightnotneed rule
catalog: whether a dependency already has a native replacement, and what
that replacement looks like.

Add it to an MCP client's config:

```json
{
  "mcpServers": {
    "youmightnotneed": {
      "command": "npx",
      "args": ["youmightnotneed-mcp"]
    }
  }
}
```

## Tools

- `analyze_dependencies`: matches a package.json's `dependencies`,
  `devDependencies` and `peerDependencies` against the catalog. Returns
  findings, a summary, and provenance for when the underlying data was
  captured.
- `list_rules`: every rule's id, title, the npm packages it replaces, and
  the native approach, in one line each.
- `get_rule`: full detail on one rule, looked up by id or by an npm
  package name it replaces. Returns `{ found: false }` rather than an
  error when nothing matches.

Data is a static snapshot, the same one `npx youmightnotneed` and
youmightnotneed.dev use. No network calls happen at tool-call time.

Powered by [`@jomae/catalog`](https://www.npmjs.com/package/@jomae/catalog).
MIT.
