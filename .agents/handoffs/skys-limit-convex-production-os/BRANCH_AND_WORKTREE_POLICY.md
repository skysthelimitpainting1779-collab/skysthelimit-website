# Mandatory Branch and Worktree Policy

## Non-negotiable

- Never modify or commit directly on `main`.
- Fetch current `origin/main`.
- Create a new integration branch and a separate integration worktree **before any edit**.
- Run the master goal inside that integration worktree.
- Create worker worktrees only after B00 and only for independent, disjoint work.
- Use no more than two concurrent writer worktrees.
- Open one PR from the integration branch to `main`.

## Base selection

The audit is frozen to:

```text
c7e94605eefdace7a76ce5145808478df8503dbb
```

The implementation branch starts from the latest `origin/main`, not blindly from the old audit SHA.

After fetching:

1. Verify whether the audited SHA is an ancestor of `origin/main`.
2. If yes, create the integration worktree from `origin/main` and perform a targeted delta audit.
3. If no, create no product changes. Report that the repository map requires structural revalidation.

## Integration model

```text
main / origin/main
    └── agent/skys-limit-convex-os[-N]       integration branch + worktree
          ├── agent/stl-b10-revenue[-N]      optional worker worktree
          ├── agent/stl-b10-security[-N]     optional worker worktree
          ├── agent/stl-b20-convex[-N]       optional worker worktree
          └── agent/stl-b20-auth[-N]         optional worker worktree
```

Worker commits are integrated into the integration branch only after their focused verification passes. The integration branch reruns the complete batch gate after integration.
