# Platform Foundation Implementation Plan

**Date:** 2026-07-30  
**Target branch:** `infra/platform-foundation`  
**Integration branch:** `dev`  
**Production branch:** `main`

## Objective

Implement the approved repository and deployment foundation without changing production
or replacing the verified Convex and Clerk architecture.

## Task 1 — Preserve the verified baseline

- Branch from exact `dev` head `ebb0282ceb275b52fe397504a2fa8792c43672d3`.
- Keep `main` untouched.
- Use atomic governed commits with evidence receipts.
- Treat the canonical Vercel `website` project as the only deployment authority.

**Acceptance:** branch ancestry is exact, no force push, no production mutation.

## Task 2 — Add executable branch-policy contracts

Create a focused Node test that proves:

- pull requests to `main` originate from `dev` or `hotfix/*`;
- pull requests to `dev` originate from an approved short-lived prefix;
- direct pushes to protected branches are rejected by the policy contract;
- the canonical Vercel project/context is the only accepted release signal;
- repository configuration enables previews for `dev` and disables ephemeral
  checkpoint branches.

Run the contract in CI before the broad suite.

**Red:** the current repository has no `dev` branch contract and CI still targets
`staging`.  
**Green:** the contract passes after workflow and configuration updates.

## Task 3 — Align repository governance

Update:

- `.github/workflows/ci.yml`;
- `.github/workflows/security.yml`;
- `.github/dependabot.yml`;
- `.github/CODEOWNERS`;
- `.github/pull_request_template.md`;
- `vercel.json`;
- `AGENTS.md`.

Add:

- branch-policy implementation and test;
- branch/release, environment, Vercel integration, and rollback documentation;
- importable GitHub ruleset desired-state manifests.

**Acceptance:** all policy sources agree on `main`, `dev`, branch prefixes, canonical
Vercel identity, preview-first deployment, and production approval boundaries.

## Task 4 — Verify exact head

Required checks:

```bash
npm run lifecycle:verify
npm run test:branch-policy
npm run ci:contract
npm run lint:ci
npm test
npm run build
```

Then verify:

- GitHub Repository Quality passes;
- GitHub Security passes;
- canonical Vercel Preview is READY for the exact commit;
- duplicate Vercel project status is not accepted as a release signal.

## Task 5 — Integrate without rewriting provenance

- Open a draft pull request to `dev`.
- Review the complete diff and exact-head checks.
- Integrate by non-forced fast-forward when possible so governed SHAs remain unchanged.
- Do not merge or promote `dev` to `main`.

## Task 6 — Track one-time provider settings

Create a single GitHub issue for settings unavailable through the current connectors:

- enable GitHub rulesets for `main` and `dev`;
- select `main` as Vercel Production Branch;
- set Standard Deployment Protection for previews;
- add a stable `dev` preview domain if desired;
- remove or disconnect the duplicate Vercel project;
- review Preview versus Production environment-variable scope;
- enable deployment checks for canonical required statuses when the plan supports them.

**Acceptance:** every manual action has an owner, exact desired state, and verification
step; no paid integration is provisioned automatically.
