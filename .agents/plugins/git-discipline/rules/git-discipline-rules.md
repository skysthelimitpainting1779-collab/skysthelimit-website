---
trigger: always_on
description: Mandatory git worktree rules, branch isolation, and staging discipline.
---

# Git Discipline Rules

1. One work item = one branch = one worktree.
2. Direct commits to `main` or `dev` are strictly forbidden.
3. Use explicit surgical `git add <file>` only; `git add .` and `git add -A` are hard-denied.
4. `--no-verify` and force pushing are hard-denied.
