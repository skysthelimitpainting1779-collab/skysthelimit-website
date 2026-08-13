---
name: hardened-validation
description: Run repository tests, builds, linters, and other validation commands with a hard timeout and guaranteed process-tree cleanup. Use for every autonomous validation command, especially in Windows worktrees where leaked child processes can lock files.
---

# Hardened Validation

Run every validation command through the bundled wrapper:

```bash
python .agents/skills/hardened-validation/scripts/run.py npm test
python .agents/skills/hardened-validation/scripts/run.py npm run build
```

Pass a command as separate arguments whenever possible. A single quoted command is also accepted for compatibility. Set `HARDENED_TEST_TIMEOUT_SECONDS` only when the default 900-second limit is insufficient.

Treat exit code `124` as a timeout. The wrapper terminates the complete process tree on timeout and again during cleanup. Do not bypass it with a bare validation command during autonomous work.
