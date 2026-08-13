# One-Time Platform Settings Checklist

These settings live in GitHub or Vercel account control planes and are not fully applied by
repository commits. Apply them against the exact desired state below, then record evidence.

## GitHub

### Protect `dev`

- Create or import the desired ruleset from `.github/rulesets/dev.json`.
- Confirm required status-context names exactly match live checks.
- Require pull requests, one approval, Code Owner review, stale-review dismissal, and
  resolved conversations.
- Block deletion and force pushes.
- Require strict current-branch status checks.
- Require `Repository Quality`, `CodeQL JavaScript and TypeScript`,
  `Production Dependency Audit`, and canonical `Vercel`.
- Do not require `Validate Branch Flow` or `Independent PR Approval` on `dev` until
  their `pull_request_target` workflow definitions exist on the default branch and have
  emitted those exact checks. During bootstrap, `Repository Quality` validates the live
  base/head edge and the native ruleset review requirement is the approval gate.
- Add no broad bypass. If exact-head non-force fast-forward integration is required, grant
  only the named release manager a narrow bypass and document every use.

### Protect `main`

- Do not activate `.github/rulesets/main.json` until the foundation workflows exist on
  the default branch and their exact status contexts have been observed.
- Accept normal release pull requests only from `dev`.
- Require the quality/security checks and canonical `Vercel` named by the
  manifest.
- Block deletion and force pushes.
- Require a named production approver and rollback evidence.

### Repository options

- Default branch remains `main`.
- Merge commits remain disabled.
- Squash merges are disabled because they discard governed commit trailers.
- Rebase merge remains enabled.
- Automatically delete merged short-lived branches when safe.
- Confirm secret scanning, push protection, Dependabot alerts, and CodeQL are enabled.

## Vercel

### Canonical project

- Team: `team_bseTA2AuCO6A2fCOVY9ubrJo`
- Project: `prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m` (`website`)
- Production Branch: `main`
- Git repository: `skysthelimitpainting1779-collab/skys-the-limit-painting-llc-website`

### Preview staging

- Confirm `dev` deploys as Preview, never Production.
- Optionally assign a stable branch domain such as `dev.skysthelimitpaintingllc.com` only
  after access control and noindex behavior are verified.
- Enable Standard Deployment Protection for Preview deployments.
- Create a dedicated automation bypass secret for GitHub smoke tests.
- Do not expose the bypass in logs or URLs.

### Environment variables

- Audit Development, Preview, `dev` branch overrides, and Production separately.
- Ensure Convex and Clerk values are matched by environment.
- Remove Production credentials from Preview unless explicitly required and approved.
- Keep deployment keys server-side and deployment-time only.
- Verify `VERCEL_TOKEN` can inspect only the intended team/project where practical.

### Deployment checks

- Confirm the GitHub Actions `Vercel` check verifies the canonical project and exact commit.
- Configure deployment checks only after verifying they cannot deadlock the release.
- Preserve exact-head deployment and route-smoke verification.

### Duplicate project

- Inspect the duplicate project under the non-canonical team.
- Export any unique settings that are genuinely required.
- Disconnect its Git repository and domains.
- Delete it only after canonical rollback evidence is confirmed.
- Close GitHub issue #172 with before/after evidence.

## Integrations

Do not install new paid or stateful integrations during the settings pass. For each future
integration, use `docs/VERCEL_INTEGRATIONS.md` and record permissions, environment scope,
cost, data ownership, and uninstall steps.

## Verification record

For each completed setting, attach:

```text
date
operator
account/team
resource ID
before state
after state
screenshot or API output
rollback action
```
