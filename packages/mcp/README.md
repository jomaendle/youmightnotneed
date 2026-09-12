# youmightnotneed-mcp

An MCP server that gives an agent direct access to the youmightnotneed rule
catalog: whether a dependency already has a native replacement, and what
that replacement looks like. The catalog is browsable at
[youmightnotneed.dev](https://youmightnotneed.dev).

Running it directly prints nothing and waits. That is correct: it speaks MCP
over stdio, so it needs a client on the other end. Register it with yours.

**Claude Code**

```sh
claude mcp add youmightnotneed -- npx -y youmightnotneed-mcp
```

Add `--scope user` to get it in every project, or `--scope project` to commit
it to the repo's `.mcp.json` for everyone.

**Claude Desktop**, in `claude_desktop_config.json`:

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

**VS Code and GitHub Copilot**

```sh
code --add-mcp "{\"name\":\"youmightnotneed\",\"command\":\"npx\",\"args\":[\"-y\",\"youmightnotneed-mcp\"]}"
```

Or `.vscode/mcp.json`, which uses `servers` rather than `mcpServers`:

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

**Cursor**, in `.cursor/mcp.json` for one project or `~/.cursor/mcp.json` for
all of them:

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

**opencode**, in `opencode.json`, where `command` is one array:

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

**Codex CLI**

```sh
codex mcp add youmightnotneed -- npx -y youmightnotneed-mcp
```

**Gemini CLI**, which takes no `--`:

```sh
gemini mcp add youmightnotneed npx -y youmightnotneed-mcp
```

The `-y` on npx matters in every one of these. Without it npx prompts before
installing, and a client that cannot answer the prompt sees a server that
never starts.

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

Data is a static snapshot, the same one `npx youmightnotneed` and
youmightnotneed.dev use. No network calls happen at tool-call time.

Powered by [`@jomae/catalog`](https://www.npmjs.com/package/@jomae/catalog).
MIT.
