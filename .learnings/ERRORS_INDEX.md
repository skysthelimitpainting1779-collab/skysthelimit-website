---
type: ledger
title: Error Learning Index
description: Token-cheap cold-start for agents. Full dumps in archive/; state in index.json.
tags: [errors, learning, index, self-heal]
---

# Error Learning Index

> **Agent cold-start:** read THIS file only (not full `ERRORS.md`).
> Updated: 2026-08-14T23:08:02.474Z | Unique: 15 | Records: 28 | Dupes suppressed: 13 | Auto-heals: 0

## Open / needs attention

_None open._

## Top lessons (deduped)

| ID | Cat | Status | × | Lesson |
|----|-----|--------|---|--------|
| ERR-20260724-bd35 | general | resolved | 2 | Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regre |
| ERR-20260727-c43b | general | resolved | 2 | Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regre |
| ERR-20260727-393e | general | resolved | 2 | Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regre |
| ERR-20260727-1553 | general | resolved | 2 | Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regre |
| ERR-20260727-a6e3 | general | resolved | 2 | Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regre |
| ERR-20260727-5972 | general | resolved | 2 | Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regre |
| ERR-20260720-9b47 | general | resolved | 2 | Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regre |
| ERR-20260720-2567 | general | resolved | 2 | Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regre |
| ERR-20260720-6314 | general | resolved | 2 | Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regre |
| ERR-20260720-6a01 | general | resolved | 2 | Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regre |
| ERR-20260720-3415 | general | resolved | 2 | Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regre |
| ERR-20260720-9be7 | general | resolved | 2 | Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regre |
| ERR-20260720-8e65 | general | resolved | 2 | Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regre |
| ERR-20260724-ac80 | general | resolved | 1 | Fixed: added Delivery acceptance and recovery section to AGENTS.md. goal:verify is the mandatory gat |
| ERR-20260724-1ccd | general | resolved | 1 | Fixed: replaced broken dev-healer Python hooks with working Node.js hooks (scripts/hooks/run.mjs). R |

## Loop commands

```bash
node scripts/learning-loop.mjs status
node scripts/learning-loop.mjs heal
node scripts/learning-loop.mjs compact
node scripts/learning-loop.mjs record --title "..." --error "..." --command "..."
```

## Read order for agents

1. `.learnings/ERRORS_INDEX.md` (this file)
2. `.agents/governance/PREVENTION_RULES.md` (if relevant category)
3. `.learnings/index.json` for machine counters (optional)
