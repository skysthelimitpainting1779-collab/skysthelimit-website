# Installing / fixing hooks

## Agent OS unified hooks

See [README.md](./README.md). Project hooks use Node: `node scripts/hooks/run.mjs <event>`.

## Windows: Semgrep + Remember (Claude plugins)

### Symptoms

- Hook errors: `The system cannot find the file specified` (WSL `bash.exe`)
- Semgrep blocks every Write/Edit: `Not logged into Semgrep Guardian`
- Remember session-start fails on every session

### Fix

```bash
npm run hooks:patch-windows
```

Then **restart Claude Code** (new session).

### After plugin update

Claude may overwrite plugin files — re-run:

```bash
npm run hooks:patch-windows
```

### Optional: real Semgrep scans

Log into Semgrep Guardian via the **guardian** MCP. Until then, PreToolUse is soft-allowed so agents are not blocked.

### Soft skip without patch

Disable plugins in Claude settings if you do not need them.
