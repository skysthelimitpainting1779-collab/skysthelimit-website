# Vercel-Native CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace seven overlapping GitHub Actions workflows and custom Vercel deployment logic with three focused workflows where Vercel owns deployment.

**Architecture:** GitHub validates source quality and security. Vercel's Git integration builds previews and production. GitHub verifies the URLs Vercel reports rather than creating or promoting deployments itself.

**Tech Stack:** GitHub Actions, Node.js 24, npm, Next.js 16, Vercel Git Integration, CodeQL.

## Global Constraints

- Keep Node.js sourced from `.nvmrc` and aligned with Vercel `24.x`.
- Use `npm ci` for every dependency installation.
- Keep all third-party GitHub Actions SHA-pinned.
- Do not use `vercel build`, `vercel deploy`, `vercel promote`, `vercel alias`, or Vercel domain mutation commands in GitHub Actions.
- Do not run a duplicate `npm run build` in GitHub Actions.
- Keep the existing `scripts/smoke-site.mjs` customer-route checks.
- Preserve the current production site until the pull request is reviewed and merged.

---

### Task 1: Add the pipeline-topology regression contract

**Files:**
- Create: `tests/cicd-topology.test.mjs`

**Interfaces:**
- Consumes: workflow files under `.github/workflows`, `vercel.json`, and `.github/production-release.json` existence.
- Produces: an executable Node test that fails against the old seven-workflow topology.

- [ ] **Step 1: Write the failing test**

Create tests that assert exactly `ci.yml`, `security.yml`, and `deployment-verification.yml` exist; reject deployment commands and `npm run build`; require the expected commands and triggers in each workflow; require `vercel.json.git.deploymentEnabled.main === true`; require `entire/* === false`; and require `.github/production-release.json` to be absent.

- [ ] **Step 2: Run the red phase remotely**

Commit only the contract and open a draft pull request so GitHub Actions and Vercel build the branch.

Expected: `npm test` fails because the old topology still contains seven workflows and `main` deployment is disabled.

- [ ] **Step 3: Capture the expected failure**

Fetch the failing workflow job and confirm the failure names the topology mismatch rather than a syntax or setup error.

---

### Task 2: Replace the CI workflow

**Files:**
- Modify: `.github/workflows/ci.yml`
- Delete: `.github/workflows/quality-gate.yml`

**Interfaces:**
- Consumes: `.nvmrc`, `package-lock.json`, `scripts/enforce-git.js`, `scripts/ci-contract.mjs`, `package.json` scripts.
- Produces: one source-validation workflow with jobs `standards` and `test`.

- [ ] **Step 1: Replace `ci.yml`**

Use pull-request and push triggers for `main` and `staging`, manual dispatch, read-only contents permission, stale-run cancellation, Node setup from `.nvmrc`, `npm ci`, `npm run ci:contract`, `node scripts/enforce-git.js`, `npm run lint:ci`, and `npm test`.

- [ ] **Step 2: Remove the reusable build workflow**

Delete `.github/workflows/quality-gate.yml` so no other workflow can call the duplicate build path.

- [ ] **Step 3: Verify the contract tests advance**

Expected: topology tests still fail only for the remaining obsolete workflows, missing consolidated workflows, Vercel configuration, and release marker.

---

### Task 3: Consolidate security workflows

**Files:**
- Create: `.github/workflows/security.yml`
- Delete: `.github/workflows/codeql.yml`
- Delete: `.github/workflows/security-scan.yml`

**Interfaces:**
- Consumes: repository source and `package-lock.json`.
- Produces: CodeQL, dependency review, and npm audit in one workflow.

- [ ] **Step 1: Create `security.yml`**

Add push and pull-request triggers for `main` and `staging`, a weekly schedule, and manual dispatch. Add three independent jobs: CodeQL JavaScript/TypeScript analysis, pull-request-only Dependency Review failing at moderate severity, and production `npm audit` failing at critical severity.

- [ ] **Step 2: Delete the superseded files**

Delete `codeql.yml` and `security-scan.yml`.

- [ ] **Step 3: Validate pinned actions and permissions**

Run the repository workflow contract and confirm actions from the same repository use one consistent SHA.

---

### Task 4: Add Vercel deployment verification

**Files:**
- Create: `.github/workflows/deployment-verification.yml`
- Modify: `scripts/smoke-site.mjs`
- Test: `tests/cicd-topology.test.mjs`

**Interfaces:**
- Consumes: `repository_dispatch` payload URL, `deployment_status` target URL, `VERCEL_AUTOMATION_BYPASS_SECRET`, and `SITE_URL`.
- Produces: URL smoke verification without deploying anything.

- [ ] **Step 1: Extend the smoke runner test contract**

Require optional request headers to be accepted by `checkSite({ baseUrl, headers })` and merged with its existing headers.

- [ ] **Step 2: Verify the new header test fails**

Expected: the supplied bypass headers are not forwarded by the current implementation.

- [ ] **Step 3: Implement optional smoke headers**

Add a `headers = {}` input and spread it after the default `accept` and `user-agent` headers.

- [ ] **Step 4: Create the deployment workflow**

Trigger on `repository_dispatch` types `vercel.deployment.success` and `vercel.deployment.promoted`, compatibility `deployment_status`, daily schedule, and manual dispatch. Resolve `SITE_URL` from the Vercel payload for deployment events and from the production domain for schedule/manual events. Install dependencies, then run `npm run smoke:site` with optional Vercel protection bypass headers.

- [ ] **Step 5: Ensure failures are actionable**

Write the chosen URL and event type to the GitHub step summary before running smoke checks.

---

### Task 5: Enable Vercel-native Git deployment and remove custom release machinery

**Files:**
- Modify: `vercel.json`
- Delete: `.github/workflows/release.yml`
- Delete: `.github/workflows/learn-pipeline.yml`
- Delete: `.github/workflows/ci-health-check.yml`
- Delete: `.github/production-release.json`

**Interfaces:**
- Consumes: the linked Vercel `website` project.
- Produces: native preview and production deployment ownership in Vercel.

- [ ] **Step 1: Enable `main` Git deployments**

Set `vercel.json.git.deploymentEnabled.main` to `true` and retain `entire/*` as `false`.

- [ ] **Step 2: Delete GitHub-owned deployment and self-test workflows**

Remove `release.yml`, `learn-pipeline.yml`, and `ci-health-check.yml`.

- [ ] **Step 3: Delete the release marker**

Remove `.github/production-release.json` because production is no longer requested through a repository marker.

- [ ] **Step 4: Verify the topology contract passes**

Expected: exactly three workflows remain and none deploys or builds the Next.js app.

---

### Task 6: Rewrite operational documentation

**Files:**
- Modify: `.github/WORKFLOW_TROUBLESHOOTING.md`
- Modify: `tests/production-pipeline-hardening.test.mjs`

**Interfaces:**
- Consumes: the final three-workflow design.
- Produces: accurate maintainer instructions and removal of obsolete release assertions.

- [ ] **Step 1: Remove custom-release tests**

Delete assertions requiring staged Vercel deployment, manual promotion, the production marker, and the removed health workflow. Preserve application behavior tests for Supabase, Directus, and route smoke checks.

- [ ] **Step 2: Rewrite workflow documentation**

Document the three workflows, Vercel ownership, required `VERCEL_AUTOMATION_BYPASS_SECRET`, production branch behavior, failure routing, and rollback through Vercel.

- [ ] **Step 3: Run all branch checks**

Require CI tests, CodeQL, dependency audit/review, and Vercel Preview Deployment to complete successfully.

---

### Task 7: Review and publish the migration pull request

**Files:**
- Review: all branch changes.

**Interfaces:**
- Consumes: verified branch state.
- Produces: one reviewable migration pull request without touching production.

- [ ] **Step 1: Inspect the complete diff**

Confirm no application feature code or customer-facing content changed.

- [ ] **Step 2: Confirm Vercel cross-reference**

Verify the branch preview belongs to project `website`, team `team_bseTA2AuCO6A2fCOVY9ubrJo`, and Node `24.x`.

- [ ] **Step 3: Update the pull request from draft to ready**

Include the red-green evidence, deleted workflows, new workflow responsibilities, Vercel project details, required Vercel dashboard configuration, and merge/rollback instructions.