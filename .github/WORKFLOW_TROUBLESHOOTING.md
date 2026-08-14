# CI/CD workflows

## Ownership model

GitHub validates source code and security. Vercel owns every Preview and Production Deployment through the repository's native Git integration.

GitHub Actions must never run `vercel build`, `vercel deploy`, `vercel promote`, `vercel alias`, Vercel domain commands, or a second `npm run build`.

## Pipeline topology

| Workflow | Trigger | Responsibility |
|---|---|---|
| `ci.yml` | Pull requests and pushes for `main` and `staging` | Workflow contract, Git standards, lockfile install, TypeScript checks, and tests |
| `security.yml` | Pull requests, pushes, weekly schedule, manual dispatch | CodeQL, dependency review, and production dependency audit |
| `deployment-verification.yml` | Vercel deployment events, daily schedule, manual dispatch | Smoke-test the exact Vercel deployment URL or the production customer domain |

Exactly these three YAML files belong in `.github/workflows`.

## Local source-validation gate

```bash
npm ci
npm run ci:contract
node scripts/enforce-git.js
npm run lint:ci
npm test
```

The GitHub CI workflow intentionally does not run `npm run build`. Vercel's Preview Deployment is the authoritative Next.js build with the correct Vercel environment and project configuration.

## Vercel project

- Project: `website`
- Project ID: `prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m`
- Team ID: `team_bseTA2AuCO6A2fCOVY9ubrJo`
- Framework: Next.js
- Node.js: `24.x`
- Production branch: `main`

`vercel.json` uses `npm ci`, enables Git deployment for `main`, and disables Git deployment for `entire/*` agent branches.

Pull requests should receive a Vercel Preview Deployment. A merge to `main` should create the Vercel Production Deployment without a GitHub Actions token or manual promotion workflow.

## Required secret

`VERCEL_AUTOMATION_BYPASS_SECRET` is optional for public deployments and required when Vercel Deployment Protection blocks automated access to preview URLs.

Create the secret in Vercel's automated-access settings and save the same value as a GitHub Actions repository secret. The smoke runner sends it only as the `x-vercel-protection-bypass` request header and never prints it.

No `VERCEL_TOKEN` repository secret is required for CI/CD.

## Deployment events

The preferred trigger is Vercel's `repository_dispatch` integration:

- `vercel.deployment.success`
- `vercel.deployment.promoted`

`deployment_status` remains as a compatibility fallback until Vercel is confirmed to send repository-dispatch events for this repository. Remove the fallback only after a successful dispatch-triggered run has been observed.

## Required merge checks

Protect `main` and require:

- `CI / Repository Quality`
- `Security / CodeQL JavaScript and TypeScript`
- `Security / Dependency Review`
- `Security / Production Dependency Audit`
- The Vercel Preview Deployment check

Do not enable dependency auto-merge unless the repository ruleset enforces every required check.

## Failure routing

- **Validate workflow contracts:** a workflow references a missing npm script, local file, or inconsistent action SHA.
- **Enforce branch and commit standards:** the PR title or branch name violates repository conventions.
- **Lint and typecheck:** TypeScript or React-version validation failed.
- **Run tests:** an application or pipeline contract failed.
- **CodeQL:** static security analysis found or failed to analyze code.
- **Dependency Review:** a pull request introduces a dependency at moderate or higher severity.
- **Production Dependency Audit:** npm reports a critical production vulnerability.
- **Verify Vercel Routes:** the reported deployment URL, customer route, expected content, or production domain is unhealthy.

## Production rollback

Rollback is owned by Vercel. Select the previous healthy Production Deployment in the Vercel dashboard and promote or roll it back there. Do not recreate a GitHub Actions deployment workflow to perform recovery.

After rollback, run `deployment-verification.yml` manually to verify the production customer routes.
