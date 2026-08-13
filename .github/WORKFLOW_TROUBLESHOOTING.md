# CI/CD Workflows

## Ownership model

GitHub validates source, branch flow, lifecycle evidence, review, and security. Vercel owns
Preview and Production deployments through the native Git integration.

GitHub Actions must not run a second application deployment. It may inspect an immutable
Vercel deployment, verify its exact commit and canonical project, and smoke-test routes.

## Core pipeline

| Workflow | Trigger | Responsibility |
|---|---|---|
| `branch-policy.yml` | `pull_request_target` after the workflow exists on default `main` | validate allowed base/head edge using trusted default-branch code |
| `pr-approval.yml` | pull-request and review events after the workflow exists on default `main` | require independent approval of the exact head |
| `ci.yml` | pull requests and pushes for `main` and `dev` | validate the live base/head edge, lifecycle, lint, types, and tests |
| `security.yml` | pull requests, pushes, schedule, manual dispatch | CodeQL, dependency review, production dependency audit |
| `deployment-verification.yml` | Vercel deployment events | verify canonical project, exact SHA, READY state, and routes |

Additional repository automation may exist, but no workflow may weaken the branch,
environment, deployment, or production-effect boundaries in `AGENTS.md`.

## Local source-validation gate

```bash
node --test tests/branch-policy.test.mjs
npm ci
npm run ci:contract
npm run lifecycle:verify
node scripts/enforce-git.js
npm run lint:ci
npm test
npm run build
```

GitHub CI intentionally does not run a second Vercel deployment. The canonical Preview is
the authoritative framework build in the selected Vercel environment.

## Canonical Vercel project

```text
Project:           website
Project ID:        prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m
Team ID:           team_bseTA2AuCO6A2fCOVY9ubrJo
Status context:    Vercel – website
Framework:         Next.js
Node.js:           24.x
Production branch: main
Preview staging:   dev
```

`vercel.json` enables Git deployment for `main` and `dev` and disables deployment for
`entire/*` checkpoint branches. Other governed work branches receive pull-request
Previews.

A status from any other Vercel project is not release evidence.

## Required secrets

### `VERCEL_TOKEN`

Required only by deployment verification so it can inspect the exact deployment and prove
that it belongs to the canonical team/project. Use the narrowest available access and
never print the value.

### `VERCEL_AUTOMATION_BYPASS_SECRET`

Required when Deployment Protection blocks automated Preview smoke tests. Store the same
dedicated value in Vercel and GitHub Actions. The smoke runner sends it only as the
protection-bypass header.

Project and team IDs are public identifiers committed as constants; they are not secrets.

## Deployment events

The preferred trigger is Vercel repository dispatch:

- `vercel.deployment.success`
- `vercel.deployment.promoted`

GitHub `deployment_status` remains a compatibility fallback. The workflow rejects events
without an exact SHA or a canonical `website-*.vercel.app` host family or approved
production domain.

## Required checks

Protect `dev` immediately with:

- `Repository Quality`, which includes the live base/head branch-policy check;
- `CodeQL JavaScript and TypeScript`;
- `Production Dependency Audit`;
- `Vercel – website`;
- the native pull-request, Code Owner, and approval rules in `.github/rulesets/dev.json`.

Do not require `Validate Branch Flow` or `Independent PR Approval` on `dev` until their
`pull_request_target` workflow definitions exist on default `main` and have emitted those
exact checks. GitHub takes `pull_request_target` workflow code from the default branch, so
requiring a not-yet-emitted context would leave the branch permanently pending.

The `main` desired-state ruleset may require the two trusted custom checks only after this
foundation reaches the default branch and their live context names are verified.
`Dependency Review` is also required for dependency-changing pull requests.

## Failure routing

- **Validate Branch Flow:** base/head branches violate the governed graph.
- **Repository Quality:** lifecycle, branch, lint, type, or test contract failed.
- **Independent PR Approval:** the PR is draft, lacks an independent approval, or changed
  after approval.
- **CodeQL:** static security analysis found a problem or failed to analyze.
- **Dependency Review:** the PR introduces a dependency at moderate or higher severity.
- **Production Dependency Audit:** npm reports a high or critical production issue.
- **Vercel status:** the canonical project failed to build or deploy.
- **Verify Vercel Routes:** the event, project, commit, URL, READY state, or customer route
  is invalid.

Do not rerun a failed check until the root cause or transient provider state is identified.

## Production rollback

Rollback is owned by the canonical Vercel project. Promote the previous healthy deployment
or use Vercel rollback, pause external effects, then verify production routes and Convex
state. Follow `docs/runbooks/platform-rollback.md`.
