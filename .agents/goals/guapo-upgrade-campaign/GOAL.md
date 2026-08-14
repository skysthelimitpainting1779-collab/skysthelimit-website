---
type: goal
slug: guapo-upgrade-campaign
title: "Guapo Upgrade Campaign"
status: active
phase: research
created: 2026-07-10T11:40:15.402Z
---

# GOAL: Guapo Upgrade Campaign

## Success criteria (edit these — must be verifiable)

- [ ] `npm run lint` passes
- [ ] `npm test` passes (or N/A if no tests touched — say why)
- [ ] Homepage clearly prioritizes residential homeowners while preserving commercial and public-sector routes
- [ ] Residential market copy communicates owner-led preparation, home protection, and final walkthrough
- [ ] No unsupported public claims are introduced

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
