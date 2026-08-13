---
name: codex-user-hook-maintenance
description: Audit and repair user-level Codex lifecycle hooks on Windows, especially command quoting, executable resolution, hook timeouts, and nonzero exits. Use when Codex reports a UserPromptSubmit or Stop user-hook failure.
---

# Codex User Hook Maintenance

Preserve unrelated user hooks and never expose credentials.

1. Inspect `%USERPROFILE%\.codex\hooks.json` and identify the exact failing event and command.
2. Run `.agents/skills/codex-user-hook-maintenance/scripts/verify-user-hooks.ps1` to detect missing scripts and unquoted Windows paths containing spaces.
3. Inspect the target script's input contract, exit handling, timeout behavior, and syntax before changing configuration.
4. Quote every filesystem argument containing spaces inside the JSON command string. Keep the outer JSON escaping valid.
5. Smoke-test the exact command with a minimal valid hook payload that cannot trigger an unintended external effect.
6. Re-run the verifier and confirm the hook exits zero within its configured timeout.

Do not delete other user hooks, print environment values, bypass Codex hook trust, or convert a recoverable memory-hook failure into a blocker for unrelated Codex lifecycle hooks.
