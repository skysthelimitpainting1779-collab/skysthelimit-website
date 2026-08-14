---
trigger: always_on
description: Verify DevHealer hooks/MCP paths are bound to this workspace before first use each session.
---

# DevHealer Workspace Binding

Configs (`hooks.json`, `mcp_config.json`, `sidecars.json`) contain hardcoded absolute paths that go stale on clone/copy.

- Run `graph_stats` — fewer than 100 nodes on a real codebase = wrong `graph.json`. Fix `mcp_config.json`.
- Every path in `hooks.json`/`sidecars.json` must resolve. Remove any MISSING entries.
- Stale prefix (e.g. `ITS/`, `MEMORY_GH/`)? Replace in all three files, commit, restart IDE.

Each project's configs are fully independent.
