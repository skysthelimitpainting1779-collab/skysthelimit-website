---
trigger: always_on
description: Antigravity hooks schema — matcher required on all PreToolUse/PostToolUse entries. Active hooks in hooks.json enforce git-discipline and graphify-grep.
---

# Antigravity Hook Rules

## Schema Requirements
- Every `PreToolUse`/`PostToolUse` entry MUST have a `"matcher"` key.
- Commands MUST use absolute paths — relative paths resolve against the terminal CWD, not workspace root.
- Each named hook block MUST have `"enabled": true`.

## Active Hooks (`hooks.json`)
| Hook | Event | Matcher | Enforcement |
|------|-------|---------|-------------|
| `dev-healer` | PreToolUse | `grep_search` | Warns when grepping `.ts/.js` for code structure (use Graphify instead) |
| `git-discipline` | PreToolUse | `run_command` | Hard-denies `git add .`, `git add -A`, `--force`, `--no-verify`, direct commits to `main`/`dev` |

## Hard Denials
- Never add a hook without a valid, resolvable absolute path for the command.
- Never disable hooks without explicit approval.
- Never use `--no-verify` to bypass Husky hooks.
- After `npm install`, verify Husky hooks still contain Entire CLI calls (`.husky/` may be overwritten).
