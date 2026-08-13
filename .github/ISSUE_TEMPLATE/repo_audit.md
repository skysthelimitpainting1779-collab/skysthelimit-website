---
name: Repository Audit Finding (move to Linear · Reliability)
about: Capture a repo-wide audit's findings as a single tracking issue, then migrate each finding to a Linear SKY issue under skysthelimit · Reliability. Use only when Linear is unavailable.
title: "[AUDIT → Linear] <short title e.g. Repo audit 2026-08-13 — auth, deps, hygiene>"
labels: ['audit', 'chore', 'area:reliability', 'p1-high']
---

> **Create findings as Linear issues under skysthelimit · Reliability** (https://linear.app/skysthelimit/team/REL). This GitHub issue is the scratch / intake for an audit pass. Link each SKY-XX back here.

## Audit metadata

| Field | Value |
|---|---|
| Audit date | <!-- e.g. 2026-08-13 --> |
| Auditor | <!-- who/what ran the audit --> |
| Baseline ref | <!-- e.g. origin/main @ <sha> --> |
| Audited ref | <!-- e.g. arena/... @ <sha> --> |
| Node / npm | <!-- e.g. Node 24 (per .nvmrc), npm 10 --> |
| Scope | <!-- static audit / tsc / tests / npm audit / next build / security / assets --> |
| Related SKY epic | <!-- SKY-XX if any --> |

## Summary (3–5 lines)

<!-- One-paragraph summary of overall health and the top themes. -->

## Health signals

<!-- Fill in actual numbers from the audit run. -->

- `tsc --noEmit` — ✅ / ⚠️ / ❌
- `npm test` — ✅ pass / ⚠️ X of Y fail / ❌ broken
- `npm audit --omit=dev` — <!-- count and top severities -->
- `next build` — ✅ / ⚠️ sandbox-only / ❌
- Hardcoded secrets found? — ✅ none / ⚠️ see findings / ❌ leaked
- Tracked repo size (approx) — <!-- MB -->

## Findings

> Use one row per finding. After migrating to Linear, fill in the SKY-XX column. Group by severity.

### P0 — production / revenue / security

| # | Area | Symptom | Evidence (file:line) | Fix | SKY-XX |
|---|---|---|---|---|---|
| 1 |  |  |  |  |  |

### P1 — reliability / DX / correctness

| # | Area | Symptom | Evidence | Fix | SKY-XX |
|---|---|---|---|---|---|
| 1 |  |  |  |  |  |

### P2 — hygiene / performance / refactor

| # | Area | Symptom | Evidence | Fix | SKY-XX |
|---|---|---|---|---|---|
| 1 |  |  |  |  |  |

## Full write-up

<!-- Link to AUDIT.md or paste the long-form audit here. -->

## Verification checklist

- [ ] Each P0 finding has a Linear SKY-XX under Reliability with status
- [ ] `tsc --noEmit` clean on Node 24
- [ ] `npm test` green on Node 24 (no env-only failures)
- [ ] `npm audit --omit=dev` shows zero high/critical production advisories
- [ ] Repo size reduced (artifacts git-rm'd, .gitignore updated)
- [ ] Dead routes / dead code documented or removed
- [ ] AUDIT.md archived or linked from this issue

## Out of scope / deferred

<!-- Things deliberately not fixed in this pass. -->

## Related

- Linear project: [skysthelimit · Reliability](https://linear.app/skysthelimit/project/skysthelimit-reliability-a29ad741ff6a)
- Prior audit: <!-- link -->
