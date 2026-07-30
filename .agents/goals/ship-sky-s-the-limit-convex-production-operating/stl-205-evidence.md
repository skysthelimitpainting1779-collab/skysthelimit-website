# STL-205 estimate builder and versioning evidence

## Governed scope

- Program: `stl-post-g20-sequential-tdd-v1`
- Checkpoint: `cp-20260730-stl205-001`
- Base head: `d996b33d1df75b81f7370eae45243b553d733f88`
- Production mutation authorized: `false`
- Provider mutation performed: `false`

## Contract

STL-205 adds a tenant-scoped staff estimate draft, server-calculated totals,
optimistic revision checks, idempotent writes, and immutable approved version
snapshots. Approved versions are append-only; later edits advance the mutable
draft without modifying an earlier snapshot.

The selected Convex contract is `/websites/convex_dev`: mutations are atomic and
isolated, thrown errors roll back their writes, all public arguments are
validated, and tenant access paths use declared indexes.

## TDD evidence

- RED: `tests/estimate-versioning.test.mjs` initially failed because
  `convex/estimates.ts` did not exist.
- GREEN: estimate behavior and UI state suites pass 8/8.
- Compatibility: estimate, CRM, Convex schema, and Cal synchronization tests
  pass 27/27.
- Goal verification: Context7 contract, lint, complete test suite, and local
  production build all pass (564/564 tests).

## Independent review

The first bounded review reported no Critical findings and four Important edge
cases. Repairs added stable retry request IDs, explicit stale-revision handling,
authentication-before-lookup behavior, and decimal quantity normalization. A
second pass found two subscription synchronization gaps; the form now locks
during mutation/synchronization and handles a subscription that advances beyond
the awaited revision. Final independent verdict: no Critical or Important
findings; ready to merge.

## Implementation evidence

- `convex/estimates.ts`
- `convex/schema.ts`
- `convex/_generated/api.d.ts`
- `src/app/(protected)/app/estimates/[id]/page.tsx`
- `src/app/(protected)/app/estimates/layout.tsx`
- `src/components/estimates/estimate-builder-state.ts`
- `src/components/estimates/estimate-builder.tsx`
- `tests/estimate-builder-state.test.mjs`
- `tests/estimate-versioning.test.mjs`
