# G20 foundation-ready evidence packet

Gate: `G20-FOUNDATION-READY`
Base revision: `3c9da0838619cf6005c457d86dea23b210891787`
Reviewed snapshot: `docs/evidence/g20-evidence-snapshot.sha256`
Prepared: 2026-07-27
Status: approved

## Required evidence

### 1. Environment isolation

**Result: PASS**

- `src/lib/env/client-schema.ts`, `src/lib/env/server-schema.ts`, and
  `src/lib/env/deployment-schema.ts` separate client, runtime, and
  deployment-only configuration.
- `scripts/validate-convex-deploy-env.mjs` fails closed when
  `NEXT_PUBLIC_APP_ENV` and the Convex deploy-key tier disagree and does not
  print the credential.
- Vercel Preview is bound to the non-production Convex deployment
  `hidden-roadrunner-577`; the recorded production deployment is
  `warmhearted-oriole-24`.
- `tests/convex-deployment-command.test.mjs` verifies the preview/production
  mismatch denial and secret-output boundary.

### 2. Authorization matrix

**Result: PASS**

- The current matrix is recorded in `docs/AUTHORIZATION_MATRIX.md`.
- The implementation source of truth is `convex/lib/authz.ts`.
- The matrix covers anonymous, missing, disabled, customer, staff, admin,
  membership, company, project, grant, permission, cross-company, and
  current-session MFA states.
- `tests/convex-domain.test.mjs` verifies the denial paths and explicit grant
  rules.

### 3. Domain event uniqueness

**Result: PASS**

- `convex/lib/events.ts` binds events and idempotency keys to canonical content.
- Conflicting duplicate events and effect keys are rejected.
- Completed effects replay their persisted stable result instead of repeating
  the effect.
- Webhook receipts separately verify provider event identity and payload hash.
- `tests/convex-domain.test.mjs` verifies conflicts, stable replay, leases,
  crash recovery, retries, and webhook hash conflicts.

### 4. Live source inventory

**Result: PASS WITH EXPLICIT BOUNDARY**

- The connector-mediated, read-only Supabase inventory recorded 11 `public`
  tables, 77 aggregate rows, RLS enabled on all 11 tables, two storage buckets,
  and no stored objects.
- The sanitized primary connector query, timestamp, opaque project identifier,
  table aggregates, RLS result, storage result, and Vercel name/scope inventory
  are retained in `docs/evidence/g20-live-source-inventory.json`.
- Payload points at the Supabase database, whose inventory has no Payload
  collection tables; no deployed Payload dataset was found.
- Production Vercel environment-name inventory contains no `DIRECTUS_URL` or
  `NEXT_PUBLIC_DIRECTUS_URL`; no configured live Directus source was found.
- No row payloads, account records, personal identifiers, secret values, or
  secret hashes were retained.
- The Convex target-inventory attempt failed closed before data access because
  owner CLI credentials and the Vercel-managed deploy key were unavailable.
  This target-export boundary is preserved for the later migration gate and is
  not misrepresented as completed migration evidence.

### 5. Reconciliation framework

**Result: PASS**

- `scripts/migrations/inventory.mjs`,
  `scripts/migrations/prepare-import.mjs`,
  `scripts/migrations/execute-convex.mjs`, and
  `scripts/migrations/reconcile.mjs` provide deterministic inventory, handoff,
  target export, import, and checksum reconciliation.
- Source provenance conflicts fail closed; target payload integrity is
  recomputed; opaque target metadata is paginated with safety limits.
- `npx tsc -p convex/tsconfig.json --noEmit` passed on 2026-07-27.
- The focused G20 suite passed 31/31 on 2026-07-27:

```text
npx tsx --test tests/convex-domain.test.mjs tests/convex-domain-schema.test.mjs tests/manage-convex-auth.test.mjs tests/convex-deployment-command.test.mjs tests/migration-inventory.test.mjs tests/convex-migration-operator.test.mjs
```

## Independent review

Two read-only reviewers queried Graphify before inspecting the worktree:

- Technical evidence reviewer: PASS for environment isolation, authorization
  matrix, domain event uniqueness, live source inventory with the explicit
  no-target-export boundary, and reconciliation framework.
- Gate-contract reviewer: the evidence structure and human approval contract
  are correct.

The technical reviewer independently repeated the sanitized Supabase metadata
inventory and `vercel env ls`, confirmed the retained results, and made no
edits. A final code-review pass verified every snapshot hash, repeated the
secret scan and diff checks, and found no technical or evidence issue. The
focused suite passed 31/31, Convex TypeScript compilation passed, and
`npm run goal:verify` passed Context7, lint, and all 383 tests at
`2026-07-27T21:50:59.825Z`.

## Approval record

Approval must be explicit and must occur after the completed evidence and
independent-review results are presented. Earlier authorization to perform the
work is not approval of the completed G20 packet.

- Approver: Johnny Cage, authenticated repository owner
- Decision: approved
- Timestamp: `2026-07-27T22:39:52.8534238Z`
- Approved snapshot/revision:
  `e330aa5bca9fc44dc417e247e43efc14bd2979ed`
- Approval text: `Proceed b25 use skills and context 7 and graphifyy`

B25 implementation is authorized subject to its own governance and verification
requirements.
