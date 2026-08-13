# B10 — Revenue and security stabilization

## Nodes

STL-001 through STL-010 were implemented in the isolated integration worktree.

## Discovery and documentation

- Graphify scoped queries: lead persistence/ManyChat, upload/manage authorization, and dynamic landing metadata/search parameters.
- Context7: `/vercel/workflow` idempotent external steps and queue-failure behavior.
- Context7: `/websites/convex_dev` Clerk identity in Convex and fail-closed backend authorization.
- Context7: `/clerk/clerk-docs` Next.js server-side role checks.
- Context7: `/vercel/next.js` dynamic metadata/not-found behavior and `useSearchParams` Suspense boundaries.
- Vercel documentation: secure upload authorization and App Router route behavior.

## Implemented evidence

- Canonical lead persistence now precedes every external effect and returns 503 when unavailable.
- Website and ManyChat retries derive stable lead IDs from idempotency keys.
- Provider delivery has a persisted reconciliation event and a secret-protected operator queue endpoint.
- ManyChat rejects requests when its authentication secret is absent or mismatched.
- Upload intents validate file name, MIME, and byte size; objects remain in the private bucket and callers receive opaque file IDs rather than public URLs.
- `/manage` is protected by a deny-by-default staff-role gate; disabled and customer identities are rejected.
- Payload staff creation/update/delete is restricted to an existing super admin.
- Legacy cabinet/commercial slugs redirect to canonical service pages.
- Missing dynamic routes and the application 404 emit explicit noindex/nofollow metadata.
- The portal login search-parameter client is enclosed by Suspense.
- Estimate submissions retain journey-specific dimensions, stories, siding, and cabinet count; corrupted copy was repaired.
- Production smoke coverage includes canonical cabinet, commercial, service-area, and real-404 journeys.

## Verification

- `npm run lint:types` — passed.
- `npm test` — passed, 325 tests.
- `npm run build` — passed, 44 static pages; reconciliation, leads, ManyChat, and upload endpoints emitted as dynamic routes.
- `tests/b10-stabilization.test.mjs` — 12 focused stabilization checks passed.
- Independent `security-verification` review initially found three blocking issues. Provider-level outbox claims, claim-gated lead RLS, and enforceable private-bucket intent mapping resolved them; final re-review found no blocker.

No production mutation or deployment was performed.
