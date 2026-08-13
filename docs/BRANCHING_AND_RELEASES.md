# Branching and Release Policy

This repository uses a two-stage protected branch model.

```text
short-lived branch
        |
        v
       dev  -------------------->  main
 non-production integration       production
 Vercel Preview                    Vercel Production
```

The machine-readable source is `config/platform-foundation.json`. The retained audited
execution graph still owns dependencies, gates, node IDs, and evidence; historical branch
names inside that graph are provenance only.

## Branch roles

| Branch | Purpose | Vercel target | Allowed inbound pull requests |
|---|---|---|---|
| `main` | Production releases | Production | `dev`, approved `hotfix/*` |
| `dev` | Integrated non-production candidate | Preview | governed short-lived branches |
| `feat/*` | New behavior | Preview | `dev` |
| `fix/*` | Defect repair | Preview | `dev` |
| `infra/*` | Platform and delivery | Preview | `dev` |
| `docs/*` | Documentation | Preview when Vercel builds it | `dev` |
| `agent/*` | Governed agent execution | Preview | `dev` |
| `hotfix/*` | Urgent production repair | Preview first | `main` after approval |
| `entire/*` | Local/session checkpoints | Disabled | none |

Additional approved prefixes are listed in the policy manifest.

## Non-negotiable rules

- No direct human or agent commits to `main` or `dev`.
- No force-push to protected or shared branches.
- One writer lease and one worktree per active mutation task.
- Every non-trivial behavior change begins with a focused failing contract.
- Every governed commit carries immutable execution trailers and a committed evidence
  receipt.
- A draft pull request is not merge approval.
- Production promotion, domains, secrets, billing, live payments, customer messaging, and
  provider-resource changes require explicit human approval.

## Pull-request flow

### Normal integration

1. Start from the exact current `dev` head.
2. Create one short-lived branch using an allowed prefix.
3. Run graph and source discovery.
4. Commit the red test and evidence.
5. Implement the smallest green change.
6. Run focused and broad verification.
7. Open a pull request to `dev`.
8. Resolve independent and security review findings.
9. Verify the canonical Vercel Preview for the exact reviewed head.
10. Integrate only after required checks pass.
11. Re-run protected-branch CI and Preview verification on the resulting `dev` head.

### Production release

1. Freeze the intended `dev` revision.
2. Open a release pull request from `dev` to `main`.
3. Record customer impact, schema/data effects, provider changes, and rollback target.
4. Require Repository Quality, Security, independent approval, and
   `Vercel – website` at the exact release head.
5. Verify the Preview and the production smoke-test plan.
6. Record explicit production approval.
7. Integrate and allow the canonical `website` project to deploy `main`.
8. Verify the immutable deployment, custom domain, critical routes, and external effects.
9. Record the release commit and deployment ID.

## Required checks

The `dev` ruleset requires checks that are available before the foundation reaches the
default branch:

- `Repository Quality`, including the live base/head branch-policy validation;
- `CodeQL JavaScript and TypeScript`;
- `Production Dependency Audit`;
- `Vercel – website`;
- native pull-request, Code Owner, and approval rules.

The `main` desired-state ruleset additionally requires `Validate Branch Flow` and
`Independent PR Approval`, but it must not be activated until those
`pull_request_target` workflows exist on default `main` and have emitted their exact
context names. `Dependency Review` must also pass whenever dependencies change.
Deployment verification and route smoke tests must pass for runtime or release work.

The JSON desired-state manifests are stored in `.github/rulesets/`. Apply each manifest
only after confirming every required context is live on its target branch. If the governed
release process uses exact-head non-force fast-forward integration, configure a narrowly
scoped release-manager bypass; never configure a force-push bypass.

## Merge and provenance

The repository permits rebase merges and disables merge commits. Rebase integration may
change commit SHAs, so the resulting protected-branch head must be treated as a new
revision and must pass lifecycle, CI, Security, and canonical Vercel verification again.

For graph-governed migrations whose evidence must preserve exact SHAs, the release manager
may use a non-force fast-forward only when:

- the pull request and exact head are fully reviewed;
- every required check passed;
- the target is an ancestor of the reviewed head;
- an explicit ruleset bypass authorizes only that operation;
- the action is recorded on the pull request.

## Hotfix policy

A `hotfix/*` branch may target `main` only for an active production incident.

Required:

- incident and customer impact;
- focused failing regression;
- smallest repair;
- canonical Preview;
- Security and independent approval;
- named rollback deployment;
- follow-up synchronization back into `dev`.

A hotfix never skips testing, evidence, or Preview.

## Release evidence

Every release record contains:

```text
source branch
source and resulting commit SHA
pull request
approver
Repository Quality result
Security result
canonical Vercel deployment ID and URL
smoke-test result
data/schema/provider effects
rollback deployment or compensating migration
```

## Recovery

Do not rewrite protected history. Revert the release or promote the last known-good
canonical Vercel deployment, then follow `docs/runbooks/platform-rollback.md`.
