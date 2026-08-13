# Upload This ZIP and Say “Execute”

1. Open a **new Codex session** attached to the Sky’s the Limit repository.
2. Ensure the **Vercel plugin/connector**, **Context7**, GitHub, and the repository are available.
3. Upload `skys-limit-codex-execute-vercel-skilled.zip`.
4. Send exactly:

```text
Execute
```

The package forces Codex to:

- create a mandatory integration branch and separate worktree from current `origin/main`;
- preserve the dirty main checkout;
- use the compiled execution graph rather than rerunning Graph Engineer;
- use the Vercel plugin for project state, deployments, logs, runtime errors, previews, and official Vercel documentation;
- inventory and use Vercel Marketplace Integrations/Connect safely;
- implement a preview-first Vercel Services topology with `web` and internal `integrations` services;
- query Context7 before every external-library task;
- load a domain-specific primary skill for every one of the 66 graph nodes;
- use no more than two isolated writer worktrees;
- execute all unblocked local, test-mode, and preview-safe work;
- stop at explicit production approval gates.

No additional prompt is required.
