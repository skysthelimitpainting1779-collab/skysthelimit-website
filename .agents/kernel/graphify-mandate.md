# Graphify Mandatory Interface Specification

**Scope:** Universal across all agents and verifiers.

---

## 1. Primary Codebase Navigation
Graphify (`graphify-out/graph.json`) is the mandatory FIRST mechanism for navigating and understanding the repository.

### Required Exploration Sequence:
1. **Graphify Query**: Run `query_graph` or `npm run graph:query -- "<intent>"` with semantic description of feature, symbol, or bug.
2. **Inspect Relevant Node**: Retrieve specific node properties, exported symbols, and module docstrings.
3. **Traverse Neighbors**: Inspect direct upstream callers and downstream dependencies.
4. **Trace Call Path**: Trace exact execution and data flow using `trace_path` or `shortest_path`.
5. **Determine Blast Radius**: Identify all components and tests affected by changes to target nodes.
6. **Surgical Source Reading**: Read only the 1–3 specific source files pinpointed by the graph traversal.

---

## 2. Forbidden Discovery Anti-Patterns
Agents are hard-prohibited from defaulting to:
- `grep` / `ripgrep` across source files
- Broad regex scans (`*` or `.`)
- Recursive filename scans (`find`, `glob **/*`)
- Dumping `GRAPH_REPORT.md` or bulk-reading `.agents/wiki/**`

---

## 3. Break-Glass Fallback Search Protocol
Text search is permitted ONLY after Graphify strategies have been legitimately exhausted.
The fallback must satisfy:
1. **Explicit Justification**: Agent must record why Graphify was insufficient (e.g. searching exact string literal, non-code regex in config, Dockerfile syntax).
2. **Narrow Scope**: Must be constrained to a single directory or exact file.
3. **Logged Event**: Must be recorded in the active work contract evidence log.
4. **Denial Outside Scope**: PreToolUse hook blocks unscoped repository-wide scans.
