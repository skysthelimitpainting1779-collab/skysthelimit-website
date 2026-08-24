# Host-Native Adapters

1. Stop only agent processes actively using the target worktree.
2. Query the code graph for the affected compiler function.
3. Check the current host schema in official documentation through Context7.
4. Change specialist content in `.agents/specialists.json` and serialization in
   `scripts/compile-host-native.mjs`; never hand-repair generated adapters.
5. Add a regression assertion to `tests/agent-os.test.mjs`.
6. Run `npm run host:compile`, the focused test, and
   `npm run skills:validate`.
7. Start the affected host from the real worktree and reject any adapter warning.

Skill mirroring is intentionally opt-in. Use
`npm run host:compile -- --mirror-skills` only when refreshed Claude/Copilot
copies are required.
