## Outcome

What measurable outcome does this change deliver?

- Product slug: **skysthelimit**
- Linear issue: **SKY-XX**
- Base branch: `dev` for normal work; `main` only for release PRs from `dev` or approved `hotfix/*`

## Execution provenance

- Program: `stl-post-g20-sequential-tdd-v1`
- Node:
- Checkpoint:
- Evidence SHA-256:
- Handoff:

## Change class

- [ ] `feat`
- [ ] `fix`
- [ ] `docs`
- [ ] `infra`
- [ ] `chore`
- [ ] `agent`
- [ ] `hotfix`

## Scope

- What changed:
- What deliberately did not change:
- Reused components, modules, and patterns:

## Test-first evidence

- Red command and intended failure:
- Green command and result:
- Related regression checks:

```bash
node --test tests/branch-policy.test.mjs
npm run ci:contract
npm run lifecycle:verify
npm run lint:ci
npm test
npm run build
```

## Environment and effects

- Target: [ ] local [ ] Preview [ ] Production
- Data: [ ] fixture/synthetic [ ] non-production [ ] production
- External effects: [ ] none [ ] email [ ] payment [ ] webhook [ ] workflow [ ] other
- [ ] No secret values or `.env` files are committed.
- [ ] Preview uses non-production Convex, Clerk, messaging, and payment resources.
- [ ] Production mutation is either absent or explicitly approved and documented.
- [ ] Idempotency, retry, cancellation, and rollback behavior are documented where relevant.

## Review and deployment

- Canonical Vercel team: `team_bseTA2AuCO6A2fCOVY9ubrJo`
- Canonical Vercel project: `prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m` (`website`)
- Exact head SHA:
- Canonical Preview deployment:
- [ ] Repository Quality passed at the exact head.
- [ ] Security passed at the exact head.
- [ ] Canonical `Vercel – website` status passed at the exact head.
- [ ] Preview UI and accessibility were reviewed when visuals changed.
- [ ] Blocking review threads are resolved.
- [ ] Rollback or compensating action is named.

## Screenshots or evidence links

Required for visual changes, provider changes, and release PRs.
