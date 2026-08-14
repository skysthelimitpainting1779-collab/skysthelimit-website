---
trigger: always_on
description: Official Antigravity hook schema and active portable enforcement boundaries.
---

# Antigravity hook contract

- Workspace hooks live in `.agents/hooks.json`.
- Every `PreToolUse` and `PostToolUse` entry has an explicit tool-name regular-expression matcher.
- Hook commands use repository-relative paths and resolve the active Git root at runtime; canonical configuration contains no machine-specific path.
- `PreToolUse` handlers read camelCase metadata plus `toolCall.name` and `toolCall.args`, then return JSON with `decision: allow | deny | ask | force_ask | deny_unless_prior_grant`.
- `PostToolUse` handlers return `{}` and only record fields Antigravity actually supplies.

Active guards cover dangerous Git commands, Graphify-first discovery, production writes/deployments, open circuits, and hub-and-spoke communication. CI and Husky remain the unbypassable repository boundary outside the IDE.
