---
type: goal
slug: ship-sky-s-the-limit-convex-production-operating
title: "Ship Sky's the Limit Convex production operating system"
status: active
phase: implement
created: 2026-07-27T08:08:37.608Z
---

# GOAL: Ship Sky's the Limit Convex production operating system

## Success criteria

- [ ] B00–B60 graph nodes that are local, fixture, test-mode, or preview-safe pass their named gates.
- [ ] `npm run lint`, `npm test`, `npm run build`, `npm run goal:verify -- --build`, and `npm run ship:eval` pass.
- [ ] All 66 graph routes resolve to a primary skill and required documentation/tool evidence.
- [ ] Lead intake fails closed, deduplicates, and retains replayable provider failures.
- [ ] Clerk identity maps to Convex users and explicit resource grants; anonymous, disabled, and cross-resource access is denied.
- [ ] Customer files are private and no raw PII is persisted in browser storage, URLs, analytics, logs, or public file URLs.
- [ ] A preview builds the `web` and internal `integrations` Vercel Services topology with service bindings and explicit rewrites.
- [ ] Migration dry-runs reconcile source/target counts and checksums and retain restore/rollback evidence.
- [ ] No production mutation, live communications/payment, GBP edit, domain action, promotion, cutover, or decommissioning occurs before its named gate.
- [ ] The dirty main checkout and paused Guapo goal remain preserved.

## Loop

1. **Research** → `research.md` — graph:query, 1–3 files, risks
2. **Plan** → `plan.md` — steps with verify checks
3. **Implement** → code; re-run `npm run goal:verify` until green
4. **Done** → `npm run goal -- done` only after verify

## Commands

```bash
npm run goal -- phase research
npm run goal -- phase plan
npm run goal -- phase implement
npm run goal:verify
npm run goal -- done
```
