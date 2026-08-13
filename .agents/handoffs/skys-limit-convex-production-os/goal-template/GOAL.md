---
type: goal
slug: skys-limit-convex-production-os
title: "Ship Sky's the Limit Convex production operating system"
status: seed
phase: research
baseline_commit: c7e94605eefdace7a76ce5145808478df8503dbb
---

# GOAL: Ship Sky's the Limit Convex production operating system

## Objective

Use the pre-audited repository map and Graph Engineer v2 execution contract to consolidate the existing Next.js application into a Convex-centered visitor-to-paid-client platform without rebuilding working functionality unnecessarily.

## Success criteria

- [ ] All modifications occur on a new integration branch in a separate worktree based on current `origin/main`.
- [ ] `main` and its working tree remain untouched.
- [ ] The compiled graph is used as the execution contract; Graph Engineer is not reinstalled or rerun during normal implementation.

- [ ] `/goal`, Graphify, ship-eval, specialists, and the graph ledger work from the repository.
- [ ] Stale target architecture cannot override `CURRENT_DECISIONS.md`.
- [ ] Confirmed P0 lead-loss, auth, file privacy, route, review, and referral failures have passing deterministic regression tests.
- [ ] Convex and Clerk pass identity, authorization, audit, event, idempotency, and migration tests.
- [ ] Legacy source data has count/checksum inventories and a tested rollback export.
- [ ] Public content has one publication authority and one route/metadata/sitemap registry.
- [ ] Visitor → durable lead → booking passes in preview.
- [ ] Estimate → proposal → agreement → Stripe test deposit passes in preview.
- [ ] Customer portal resource isolation and private-file authorization pass.
- [ ] Revenue attribution reconciles against canonical opportunity/payment facts.
- [ ] Lint, test, build, E2E, accessibility, security, and migration gates pass.
- [ ] No unrelated files are changed.
- [ ] No production side effect occurs without its named gate.
- [ ] Completion evidence classifies functionality as reused, repaired, migrated, replaced, or removed.
