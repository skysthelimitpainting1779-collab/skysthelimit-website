---
name: worktree-management
description: Creates, manages, and cleans isolated git worktrees for agent implementation tasks.
---

# Git Worktree Management Skill

## Workflow
1. Create new feature worktree:
   `git worktree add skys-limit-worktrees/feat-<issue_id> -b feat/<issue_id>-<topic>`
2. Execute bounded work inside worktree.
3. Commit surgical changes with standard conventional commit format.
4. Clean up worktree after merge/PR:
   `git worktree remove skys-limit-worktrees/feat-<issue_id>`
