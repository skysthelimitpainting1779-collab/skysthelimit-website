---
name: entire-checkpoint-maintenance
description: Audit, repair, and verify Entire CLI checkpointing across Git and agent hooks without removing project-specific hook chains. Use after Entire upgrades, npm install, hook regeneration, worktree setup, or any checkpointing failure.
---

# Entire Checkpoint Maintenance

Preserve checkpointing and existing non-Entire hook behavior.

1. Run `scripts/verify-entire-hooks.ps1` from the repository root.
2. Confirm Entire is installed, `.entire/settings.json` is enabled, and `core.hooksPath` resolves to `.husky`.
3. Repair managed hooks with Entire's supported configuration command. Inspect the diff before accepting it.
4. Reinstall the native Codex integration with `entire agent add codex --force`; verify all four project hook events are declared.
5. Ensure each required Git entrypoint contains exactly one matching `entire hooks git <hook>` call and is tracked executable.
6. Remove only stale chained hook copies that invoke Entire again. Preserve project-specific behavior such as Graphify, lint, and checkout synchronization.
7. Install Graphify's native commit/checkout integration with `graphify hook install`. Ensure commit updates are not skipped merely because work occurs in an isolated Git worktree.
8. Validate shell syntax, run `entire status`, `entire doctor`, and `graphify hook status` without disabling checkpointing.
9. Run `npm run skills:validate` and `npm run host:compile`.
10. Exercise `prepare-commit-msg`, `commit-msg`, and `post-commit` with a real scoped commit. After the detached graph refresh finishes, rerun the verifier with `-RequireFreshGraph`. Confirm the commit/checkpoint linkage, Graphify update result, and Entire status afterward.

Never disable Entire, remove its hooks, rewrite history, or discard a non-Entire hook chain. If automated repair changes unrelated hook behavior, stop and restore that behavior surgically.
