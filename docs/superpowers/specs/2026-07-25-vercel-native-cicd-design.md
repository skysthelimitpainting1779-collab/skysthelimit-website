# Vercel-Native CI/CD Design

## Goal

Replace the repository's overlapping GitHub Actions and custom Vercel release machinery with three focused workflows where GitHub validates source and Vercel owns deployment.

## Architecture

Vercel's Git integration is the only deployment owner. Pull requests produce Vercel Preview Deployments and `main` produces the Production Deployment. GitHub Actions never runs `vercel build`, `vercel deploy`, `vercel promote`, domain mutation commands, or a second Next.js production build.

GitHub Actions has three responsibilities:

1. `ci.yml` validates repository standards, workflow contracts, TypeScript, and tests.
2. `security.yml` runs CodeQL, dependency review, and production dependency audit.
3. `deployment-verification.yml` validates successful Vercel deployments and runs a lightweight scheduled production smoke check.

## Workflow Topology

### CI

Triggers on pull requests targeting `main` or `staging`, and pushes to `main` or `staging`. It uses Node 24 from `.nvmrc`, installs with `npm ci`, validates workflow contracts, enforces Git standards, runs `npm run lint:ci`, and runs `npm test`.

CI does not run `npm run build`; the Vercel deployment is the authoritative Next.js build and environment integration check.

### Security

Triggers on pull requests and pushes for `main` and `staging`, weekly schedule, and manual dispatch. It contains:

- CodeQL JavaScript/TypeScript analysis in build mode `none`.
- Dependency Review for pull requests, failing on moderate or higher severity.
- `npm audit --audit-level=critical --omit=dev` for pushes, pull requests, schedules, and manual runs.

All actions are SHA-pinned and permissions are job-scoped.

### Deployment Verification

Triggers on Vercel `repository_dispatch` events `vercel.deployment.success` and `vercel.deployment.promoted`, with `deployment_status` retained as a compatibility fallback while the Vercel integration migration is verified. It also runs a scheduled production smoke test and supports manual dispatch.

For a successful Vercel deployment, it installs dependencies with `npm ci` and runs `npm run smoke:site` against the deployment URL supplied by Vercel. The workflow sends Vercel's automated-access headers when `VERCEL_AUTOMATION_BYPASS_SECRET` is configured.

For production verification and the scheduled health check, it uses `https://www.skysthelimitpaintingllc.com`.

## Vercel Configuration

`vercel.json` remains the source of truth for framework, build command, install command, headers, redirects, cron configuration, and ignored internal branches.

Git deployment configuration changes to:

```json
"git": {
  "deploymentEnabled": {
    "main": true,
    "entire/*": false
  }
}
```

The Vercel project remains linked to:

- Project: `website`
- Project ID: `prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m`
- Team ID: `team_bseTA2AuCO6A2fCOVY9ubrJo`
- Node.js: `24.x`

The custom domain must be attached to the `website` project in Vercel before the migration is merged. GitHub Actions will no longer claim, verify, alias, or promote domains.

## Removed Components

Delete these workflows:

- `.github/workflows/quality-gate.yml`
- `.github/workflows/codeql.yml`
- `.github/workflows/security-scan.yml`
- `.github/workflows/release.yml`
- `.github/workflows/learn-pipeline.yml`
- `.github/workflows/ci-health-check.yml`

Replace `.github/workflows/ci.yml` and create the two consolidated workflows.

Delete `.github/production-release.json` and remove documentation and tests that require a custom GitHub-driven Vercel release path.

## Testing

Repository contract tests must prove:

- Exactly three YAML workflow files exist.
- No workflow invokes Vercel deployment commands.
- No workflow runs `npm run build`.
- `ci.yml` runs install, workflow contract, Git standards, lint/typecheck, and tests.
- `security.yml` contains CodeQL, dependency review, and production audit.
- `deployment-verification.yml` consumes Vercel deployment events and uses the existing smoke runner.
- `vercel.json` enables `main` Git deployments and keeps `entire/*` disabled.
- The obsolete release marker does not exist.

The red phase is committed before the implementation. The branch is considered ready only after CI, security, and the Vercel Preview Deployment are green.
