# youmightnotneed-mcp

An MCP server that gives an agent direct access to the youmightnotneed rule
catalog: whether a dependency already has a native replacement, and what
that replacement looks like. The catalog is browsable at
[youmightnotneed.dev](https://youmightnotneed.dev).

## Install

Pick your client. The server needs one: run it bare in a terminal and it
prints nothing, because a stdio server waits for a client to speak first.

| Client | Command |
|---|---|
| Claude Code | `claude mcp add youmightnotneed -- npx -y youmightnotneed-mcp` |
| Codex CLI | `codex mcp add youmightnotneed -- npx -y youmightnotneed-mcp` |
| Gemini CLI | `gemini mcp add youmightnotneed npx -y youmightnotneed-mcp` |
| VS Code, Copilot | `code --add-mcp "{\"name\":\"youmightnotneed\",\"command\":\"npx\",\"args\":[\"-y\",\"youmightnotneed-mcp\"]}"` |

On Claude Code, add `--scope user` for every project, or `--scope project` to
commit it to the repo's `.mcp.json`.

<details>
<summary>Editing a config file instead</summary>

Claude Desktop (`claude_desktop_config.json`) and Cursor (`.cursor/mcp.json`,
or `~/.cursor/mcp.json` for every project):

```json
{
  "mcpServers": {
    "youmightnotneed": {
      "command": "npx",
      "args": ["-y", "youmightnotneed-mcp"]
    }
  }
}
```

VS Code (`.vscode/mcp.json`) uses `servers`, not `mcpServers`:

```json
{
  "servers": {
    "youmightnotneed": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "youmightnotneed-mcp"]
    }
  }
}
```

opencode (`opencode.json`) takes `command` as one array:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "youmightnotneed": {
      "type": "local",
      "command": ["npx", "-y", "youmightnotneed-mcp"]
    }
  }
}
```

Keep the `-y`. Without it npx asks before installing, and a client that cannot
answer sees a server that never starts.

</details>

## Tools

- `analyze_dependencies`: matches a package.json's `dependencies`,
  `devDependencies`, `peerDependencies` and `optionalDependencies` against
  the catalog. Returns findings, a summary, and provenance for when the
  underlying data was captured.
- `list_rules`: every rule's id, title, the npm packages it replaces, and
  the native approach, in one line each.
- `get_rule`: full detail on one rule, looked up by id or by an npm
  package name it replaces. Returns `{ found: false }` rather than an
  error when nothing matches.

A finding and a `get_rule` result may both carry `guides`: modern-web-guidance
guide IDs with the URL and the command that retrieves one. This catalog gives
the one-line swap; the guide gives the fallbacks and the gotchas, so read one
before writing the replacement.

A finding or a `get_rule` result may also carry `lintRule`, naming a lint rule
that already checks the shape mechanically, and `agent.handRolled`, describing
the shapes people write by hand instead. `list_rules` returns every hand-rolled
shape in one call, which is the index to use when you are holding code rather
than a package name. [youmightnotneed.dev/checks](https://youmightnotneed.dev/checks)
shows which rules fall on which side.

Data is a static snapshot, the same one `npx youmightnotneed` and
youmightnotneed.dev use. No network calls happen at tool-call time.

Powered by [`@jomae/catalog`](https://www.npmjs.com/package/@jomae/catalog).
MIT.
