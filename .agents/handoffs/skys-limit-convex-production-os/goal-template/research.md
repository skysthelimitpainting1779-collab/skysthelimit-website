# Research — Sky's the Limit Convex production operating system

## Frozen baseline

- Repository: `skysthelimitpainting1779-collab/skys-the-limit-painting-llc-website`
- Audited commit: `c7e94605eefdace7a76ce5145808478df8503dbb`

## Branch and baseline

- Run inside the dedicated integration worktree, never `main`.
- Base the integration branch on current `origin/main`.
- Compare current `origin/main` to the audited SHA.
- Perform only a targeted delta audit when the audit SHA remains an ancestor.

## Read order

1. `CURRENT_DECISIONS.md`
2. `AUDIT_SNAPSHOT.md`
3. `REPO_MAP.json`
4. `EXECUTION_BATCHES.json`
5. `NODE_BINDINGS.json`
6. The active node section of `source/graph-engineered-v2.json`
7. A referenced master-audit section only when needed

## Initial Graphify queries

```text
Trace the repository control plane from AGENTS.md through package scripts, goal.mjs, graph-context.mjs, specialist compilation, hooks, and Codex MCP configuration.

Trace public lead submission from LeadForm and Estimate through /api/leads, persistence, lead events, Resend, HubSpot, custom webhook, ManyChat, and tests.

Trace every authentication and authorization boundary for /manage, /portal, /admin, Supabase Auth, Payload users, RLS, and browser CRUD.

Trace every file upload and retrieval path for lead photos, CMS assets, project files, and Payload media.

Trace all content sources used by projects, services, testimonials, navigation, metadata, sitemap, robots, and redirects.
```

Stop broad discovery once the active packet identifies the exact files, symbols, tests, risks, and external contract. Do not redo the full audit.
