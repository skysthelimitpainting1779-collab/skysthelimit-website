# Verification and Evidence Policy

## Ladder

1. **Implementation loop:** focused failing test, smallest correct change, focused passing test.
2. **Node completion:** related tests, scoped typecheck, acceptance evidence, resource-lock release.
3. **Batch completion:** full lint/test plus relevant integration or E2E suite.
4. **Major gate:** production build, preview checks, accessibility, security, and migration review.
5. **Cutover gate:** count/checksum reconciliation, canary, rollback rehearsal, restore evidence, and independent approval.

## Mandatory regression cases

- Persistence failure never returns lead success.
- Duplicate submissions create one canonical lead.
- Provider failure retains the lead and creates replayable failure state.
- Estimate journeys satisfy one shared lead contract.
- Anonymous, customer, and disabled users cannot access operator data.
- Customer files are private and cross-project retrieval is denied.
- Every customer receives the same optional public-review path.
- No full lead PII is stored in localStorage.
- Referral URLs and analytics contain no email address.
- Every linked route resolves to a canonical page or approved redirect.
- 404 metadata is noncanonical and nonindexable.
- Clerk lifecycle changes propagate to the mapped Convex user.
- Convex authorization denies access unless an explicit resource grant exists.
- Stripe test webhooks are signature-verified and event-ID idempotent.
- Migration source/target counts and checksums reconcile.

## Failure policy

- Agent assertion is not evidence.
- Do not paste complete successful logs into model context; store artifacts and summarize.
- A test change that preserves incorrect behavior fails review.
- High-risk implementation requires an independent verifier.
- After two failed implementation attempts for the same cause, create a diagnostic/replan node.
- Do not repeat the full repository audit unless evidence shows this map is materially stale.
