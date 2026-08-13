# Development Lifecycle

This lifecycle is shared by humans and coding agents. Git is the source of code truth, the
audited JSONL defines allowed execution order and stop gates, and the local control-plane
database coordinates runtime leases and handoffs.

The operational branch contract is defined in `config/platform-foundation.json`:

```text
short-lived branch -> dev -> main
                      |      |
                    Preview Production
```

Historical branch names retained in audited evidence are provenance only.

## State ownership

| State | Authority | Git policy |
|---|---|---|
| Application code and migrations | Git branch and pull request | tracked |
| Operational branch flow | `config/platform-foundation.json` | tracked |
| Execution plan and stop gates | `.agents/execution/*-audited.jsonl` | tracked and hash-pinned |
| Worktree code graph | `graphify-out/graph.json` | generated and ignored |
| Checkpoints, leases, handoffs, deployments | local control-plane database | never tracked |
| Session transcript checkpoint | Entire CLI | Git-linked refs |
| Preview deployment | canonical Vercel `website` project | exact commit SHA |
| Production deployment | canonical Vercel `website` project from `main` | exact commit SHA |

`.graph/` is legacy planning history. It cannot authorize execution or store live progress.

## Work loop

1. Start from the exact current `dev` head in a clean checkout.
2. Query the shared graph and relevant source paths.
3. Call execution-graph preflight, then read the cursor and selected node.
4. Create one allowed short-lived branch and isolated worktree.
5. Acquire the program writer lease.
6. Write a focused test or contract and prove the intended RED failure.
7. Implement the smallest correct change and prove the same contract GREEN.
8. Run related regression, lint, type, security, and cost checks appropriate to the node.
9. Write a hash-addressed evidence receipt and commit it with required trailers.
10. Run `npm run lifecycle:verify` from a clean revision.
11. Push the short-lived branch without force and open or update the pull request to `dev`.
12. Complete independent review and exact-head canonical Vercel Preview verification.
13. Integrate only after the required checks pass.
14. Accept the graph-validated handoff before beginning the next checkpoint.

Only one mutation-capable agent may hold a writer lease for the active scope. Read-only
discovery, review, and verification may run concurrently within the graph limits.

## Commit contract

Every governed commit after audited baseline
`5eb385d33976503cdac81e982ed74fbbc7f6839c` uses Conventional Commits and these trailers:

```text
fix(scope): concise outcome

Execution-Program: stl-post-g20-sequential-tdd-v1
Execution-Node: <audited-node-id>
Checkpoint-ID: cp-<stable-id>
Evidence-SHA256: <64 lowercase hex characters>
```

The evidence digest names `.agents/execution/evidence/<digest>.json`. CI hashes the
committed receipt, checks its program and node against the audited graph, and requires
named passing verification.

Receipt authors cannot self-assert independent approval. The `Independent PR Approval`
workflow runs trusted verifier code from the protected base revision and requires a
reviewer other than the author to approve the exact head SHA.

Do not commit databases, WAL files, generated Graphify output, runtime checkpoints,
tokens, secrets, `.env` files, raw PII, or unrestricted logs.

## Branch and pull-request contract

- `main` is production-only.
- `dev` is the non-production integration branch.
- Normal work targets `dev`.
- Only `dev` or an approved `hotfix/*` branch may target `main`.
- Direct pushes and force pushes to `main` and `dev` are prohibited.
- Pull requests stay draft while the execution cursor, review, or approval gate is
  blocked.
- The pull-request body records program, node, checkpoint, evidence hash, environment,
  effect class, exact head, Preview deployment, and rollback path.

CI validates:

- branch flow;
- workflow/local-command consistency;
- pinned graph and sidecars;
- governed commits and evidence receipts;
- forbidden runtime state;
- lint and TypeScript;
- repository tests;
- security and dependency checks.

## Vercel

The canonical deployment authority is:

```text
Team:    team_bseTA2AuCO6A2fCOVY9ubrJo
Project: prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m
Name:    website
Status:  Vercel – website
```

Vercel Git integration owns application builds. GitHub Actions verifies the immutable
deployment event, exact commit, canonical project, READY state, and customer-route smoke
tests.

- `main` deploys to Production.
- `dev` and short-lived branches deploy to Preview.
- `entire/*` checkpoint branches do not deploy.
- A duplicate Vercel project or status is not release evidence.
- Production changes remain blocked until the named approval gate is explicit.

## Environment and external effects

Development, Preview, and Production use isolated Convex, Clerk, communication, and
payment bundles. Preview must not send unrestricted customer messages, charge live payment
methods, mutate production data, or perform irreversible provider actions.

Every external effect requires:

- verified provider account, team, project, and environment;
- idempotency;
- bounded retries and timeout;
- cancellation;
- observability;
- a kill switch;
- rollback or compensation.

See `docs/ENVIRONMENT_MATRIX.md`.

## Local control-plane operation

`SKY_DEV_CONTROL_PLANE` can point launchers at the workspace containing the repository when
parent-directory discovery is unavailable. `SKY_DEV_RUNTIME` overrides the local database
location. Runtime coordination state remains outside Git.

Post-commit and post-checkout Graphify hooks update the worktree graph only after a
completed rebuild. Pre-push fails when the graph or control-plane mirror is stale.

Local SQLite is canonical for agents sharing one machine. Turso may later replicate
coordination across machines only with the same append-only event IDs and hashes, one
remote writer lease transaction, and local SQLite as an offline cache. Application data
and lifecycle-control data remain separate.

## Recovery

- Stale graph: rebuild Graphify and resync the control plane.
- Dirty worktree: commit governed work or move unrelated changes to another worktree.
- Expired lease: confirm the previous session is inactive before acquiring a new one.
- Failed handoff: keep it pending with blockers; never advance the cursor artificially.
- Invalid audited graph: restore the manifest-pinned artifact and stop execution.
- Failed Preview: repair on the work branch; do not integrate.
- Failed Production: pause effects, revert or promote a known-good canonical deployment,
  then follow `docs/runbooks/platform-rollback.md`.
