---
trigger: always_on
description: Graphify query first; never dump wiki or GRAPH_REPORT. Hard deny on grep/cat/ls for code structure.
---

# Graphify (token discipline)

## Code Discovery — Mandatory Priority Order
1. **Always query the shared SQLite graph first** via `agentgraph_dev/graphify_db_search`, then use `graphify_db_neighbors` or `graphify_db_path` for relationships. The launcher binds unscoped queries to the requesting worktree through `AGENTGRAPH_SOURCE_ROOT`; never clear or override it.
2. Use `graphify/query_graph` for worktree-local semantic context when the shared graph has not indexed the latest commit.
3. Retry with a rephrased question before falling back — Graphify uses semantic BFS; different phrasing finds different nodes.
4. Fall back to grep/glob/cat ONLY for: string literals, error messages, config values, non-code files (Dockerfiles, shell scripts, JSON configs).
5. Open only the **1–3** source files cited by the graph result.

## Hard Denials
- NEVER use `cat`, `ls`, `grep` to discover functions, classes, routes, or component structure — use the graph.
- NEVER grep `.ts`/`.tsx`/`.js` files when the question is about code relationships or architecture.
- Paste `graphify-out/GRAPH_REPORT.md` into context — NEVER.
- Bulk-read `graphify-out/wiki/**` or `.agents/wiki/` — NEVER.

## If Graphify Returns 0 or <100 Nodes
Run `graph_stats` immediately. If node count is wrong for a real codebase, the MCP is mis-bound to another project's graph.json. See `devhealer-workspace-binding.md` for the fix protocol.

Wiki pages under `graphify-out/wiki` are **query/navigate only**, not always-on memory.
