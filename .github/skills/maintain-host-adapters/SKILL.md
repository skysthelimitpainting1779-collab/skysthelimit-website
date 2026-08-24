---
name: maintain-host-adapters
description: Regenerate and verify host-native specialist adapters from the repository source of truth. Use when changing .agents/specialists.json, scripts/compile-host-native.mjs, generated Claude/Cursor/Codex/Copilot/Gemini files, or when a host rejects an adapter at startup.
---

# Maintain Host Adapters

Treat `.agents/specialists.json` and `.agents/skills/` as content sources and
`scripts/compile-host-native.mjs` as the adapter schema compiler.

1. Check for another agent process using the target worktree. Stop only the
   exact conflicting process before changing generated configuration.
2. Query the code graph for the affected compiler function before reading
   source files.
3. For an external host schema change, query current official documentation
   through Context7 and record the selected library ID and relevant contract.
4. Edit specialist content in `.agents/specialists.json`. Edit serialization
   or host schema behavior in `scripts/compile-host-native.mjs`. Never repair
   generated adapter files individually.
5. Add or update a regression assertion in `tests/agent-os.test.mjs`. Reproduce
   the failure against the existing generated files before regeneration.
6. Run:

   ```bash
   npm run host:compile
   node --test tests/agent-os.test.mjs
   npm run skills:validate
   npm run host:compile
   ```

7. Inspect `git diff` and preserve unrelated worktree changes. Generated
   outputs should differ only where the source or compiler contract changed.
8. Start the affected host from the real target worktree and verify that its
   startup emits no adapter warnings. A parser-only check is insufficient.

Stop on malformed-role warnings, an unexpected generated diff, or a failed
validation. Do not let an agent continue with silently ignored specialists.
