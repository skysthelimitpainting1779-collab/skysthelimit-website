---
name: convex-migration-operator
description: Safely validate, apply, export, and reconcile approved offline CRM migration handoffs against an explicitly selected Convex deployment. Use for every repeated Convex migration execution, replay, target inventory export, and reconciliation operation.
---

# Convex Migration Operator

Use `npm run migration:convex --` for the complete operator path.

1. Generate the sensitive handoff outside the repository with `prepare-import.mjs --dry-run`.
2. Run operator `--dry-run` with explicit `--deployment` and `--environment`; verify its opaque run ID, count, and checksum.
3. Before `--apply`, obtain migration approval and pass both `--confirm-run-id` and `--confirm-deployment` exactly. Production additionally requires `--allow-production`.
4. Never add `--push`; deploy reviewed Convex functions separately before migration execution.
5. Require the deployment identity preflight to match `--environment` before any mutation or export. Never bypass a mismatch by relabeling a deployment.
6. Export the target inventory to a new path outside the repository. The export must contain only opaque canonical IDs, checksums, entity names, and reconciliation status.
7. Run `reconcile.mjs --dry-run` with the original handoff and exported Convex target inventory.
8. Stop on any conflict, checksum mismatch, malformed CLI response, or deployment-selection mismatch. Do not retry with changed inputs under the same run ID.

Do not store handoffs, target inventories, credentials, or raw dynamic execution
output in the repository. Sanitized gate evidence may record opaque provider IDs,
counts, timestamps, and cleanup results. Do not log operation payloads or raw
provider errors.

## Preview environment administration

Fresh Vercel branches receive fresh Convex Preview deployments. Configure these
static project defaults, scoped only to Preview, before triggering a branch
build:

- `NEXT_PUBLIC_APP_ENV=preview`
- `CLERK_JWT_ISSUER_ENV=preview`
- `CLERK_JWT_ISSUER_DOMAIN` as the exact Clerk development HTTPS origin
- `CLERK_SECRET_KEY` with the `sk_test_` tier

Load the candidate values through the approved secret boundary and run
`npm run validate:convex-preview-defaults` before any provider mutation. Then
use Project Settings > Default Environment Variables in the Convex dashboard,
or an authenticated project-owner session with
`npx convex env default set NAME --type preview --project skysthelimitpainting1779-4125-s-projects:skysthelimit`.
Verify the exact team-qualified project, names, Preview-only scopes, and
sanitized validation result. Never log or persist secret values.

Do not run `convex env set` or copy provider secrets before
`convex deploy --cmd`. The Preview deploy key selects or creates the
branch-specific deployment during `convex deploy`; project defaults are the
supported input for that creation step. Keep the declarations in
`convex/convex.config.ts` so missing static defaults fail deployment, and keep
the operator preflight as the credential-tier guard.

## Clerk Preview webhook provisioning

Do not store `CLERK_WEBHOOK_SIGNING_SECRET` as a project default. Clerk signing
secrets are endpoint-specific, while each fresh Convex Preview has a different
site URL. The webhook variable is optional during the first Convex deploy and
the lifecycle route fails closed with `503` until provisioning completes.

After Vercel creates the exact branch Preview:

1. Resolve and verify the exact commit, Vercel deployment, provider-reported
   Convex deployment type `preview`, deployment name, and
   `https://<deployment>.convex.site` origin.
2. Create one Clerk development endpoint at the exact
   `<CONVEX_SITE_URL>/clerk/lifecycle` URL. Subscribe only to `user.created`,
   `user.updated`, `user.deleted`, `invitation.accepted`, and
   `invitation.revoked`.
3. Supply the candidate endpoint URL and newly issued signing secret through
   the approved secret boundary. Run `npm run validate:convex-preview-webhook`.
4. Load a project-scoped Convex Management API token, numeric project ID, exact
   Vercel branch identifier, endpoint URL, and signing secret through the
   approved secret boundary. Run `npm run provision:convex-preview-webhook`.
   The operator fetches `GET /v1/deployments/<name>`, verifies the provider
   response reports type `preview`, the expected project and branch, and a
   matching Convex cloud URL, derives the site URL, then passes that exact
   provider-returned deployment name to `convex env set` in the same process.
   The secret is piped over stdin and credentials are removed from the child
   environment; never place secrets in arguments, logs, evidence, or repository
   files.
5. Verify endpoint target, event set, exact Convex deployment identity, and a
   fail-closed lifecycle smoke before accepting the Preview handoff.

Delete the branch-specific Clerk endpoint when its Preview deployment is
retired. Never reuse an endpoint signing secret for another Preview.

Production keeps the Convex declaration optional only so Preview bootstrap can
complete. Before deployment, `npm run validate:convex-deploy-env` verifies the
environment tier and deployment-bound `prod:` key. After the functions deploy,
`npm run verify:convex-production-webhook` sends an unsigned probe to the
deployment name bound into that key. The route returns a versioned contract
header with `503` for a missing or malformed signing secret and `400` only after
a configured secret reaches signature verification. Post-deploy verification
requires both the `400` and the new contract version, so the first rollout
cannot be approved by the less strict previous handler. This verifies readiness
without giving the CI deploy key environment-secret read permission. Do not
duplicate the Convex runtime secret into Vercel.

Changing project defaults has no effect on existing deployments. To repair an
already-created Preview, authenticate as the Convex project owner, select the
exact named deployment, update only the approved variables, verify its identity,
and trigger a new Preview build. Never apply Preview defaults to Development or
Production, and never retry account administration with a deploy-only key.

## Clerk Preview issuer discovery

When the Convex Preview deployment needs `CLERK_JWT_ISSUER_DOMAIN`, run
`scripts/derive-clerk-preview-issuer.ps1`. It reads the existing Vercel Preview
publishable key only inside an access-restricted scratch directory, validates
the `pk_test_` tier, decodes Clerk's documented Frontend API origin, deletes the
scratch directory, and returns only the non-secret HTTPS issuer origin plus
sanitized lifecycle evidence.
