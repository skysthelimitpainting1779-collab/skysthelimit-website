---
type: ledger
title: Error Learning Log (active)
description: Compact active failures only. Full history in .learnings/index.json (no archive dumps).
tags: [errors, learning, self-heal]
---

# Errors Log (Active)

> Agents: read `.learnings/ERRORS_INDEX.md` first (not this whole file).
> Duplicates are suppressed by fingerprint. No filesystem archives (ontology hard-delete policy).


## [ERR-20260720-9b47] Synthetic failure dedupe-test-1784559970359

**Logged**: 2026-07-20T15:06:10.486Z
**Fingerprint**: `d58a0248d6022326`
**Category**: general
**Severity**: medium
**Status**: open
**Area**: test
**Count**: 1

### Summary
Synthetic failure dedupe-test-1784559970359 — `node -e "process.exit(1)"`

### Error (snippet)
```text
unique-marker-dedupe-test-1784559970359 boom
```

### Prevention
Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regression test when durable, then re-run verify chain.

### Metadata
- Archive: n/a
- Healable: false


## [ERR-20260720-2567] Synthetic failure dedupe-test-1784560004209

**Logged**: 2026-07-20T15:06:44.327Z
**Fingerprint**: `86ffd2ce2b7f9a93`
**Category**: general
**Severity**: medium
**Status**: open
**Area**: test
**Count**: 1

### Summary
Synthetic failure dedupe-test-1784560004209 — `node -e "process.exit(1)"`

### Error (snippet)
```text
unique-marker-dedupe-test-1784560004209 boom
```

### Prevention
Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regression test when durable, then re-run verify chain.

### Metadata
- Archive: n/a
- Healable: false


## [ERR-20260720-6314] Synthetic failure dedupe-test-1784560157044

**Logged**: 2026-07-20T15:09:17.180Z
**Fingerprint**: `bec0e10dddfec496`
**Category**: general
**Severity**: medium
**Status**: open
**Area**: test
**Count**: 1

### Summary
Synthetic failure dedupe-test-1784560157044 — `node -e "process.exit(1)"`

### Error (snippet)
```text
unique-marker-dedupe-test-1784560157044 boom
```

### Prevention
Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regression test when durable, then re-run verify chain.

### Metadata
- Archive: n/a
- Healable: false


## [ERR-20260720-6a01] Synthetic failure dedupe-test-1784560214381

**Logged**: 2026-07-20T15:10:14.702Z
**Fingerprint**: `c72e738b28f76609`
**Category**: general
**Severity**: medium
**Status**: open
**Area**: test
**Count**: 1

### Summary
Synthetic failure dedupe-test-1784560214381 — `node -e "process.exit(1)"`

### Error (snippet)
```text
unique-marker-dedupe-test-1784560214381 boom
```

### Prevention
Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regression test when durable, then re-run verify chain.

### Metadata
- Archive: n/a
- Healable: false


## [ERR-20260720-3415] Synthetic failure dedupe-test-1784560251513

**Logged**: 2026-07-20T15:10:51.816Z
**Fingerprint**: `90153757ae34043a`
**Category**: general
**Severity**: medium
**Status**: open
**Area**: test
**Count**: 1

### Summary
Synthetic failure dedupe-test-1784560251513 — `node -e "process.exit(1)"`

### Error (snippet)
```text
unique-marker-dedupe-test-1784560251513 boom
```

### Prevention
Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regression test when durable, then re-run verify chain.

### Metadata
- Archive: n/a
- Healable: false


## [ERR-20260720-9be7] Synthetic failure dedupe-test-1784560317795

**Logged**: 2026-07-20T15:11:58.058Z
**Fingerprint**: `fdbf1032c1674059`
**Category**: general
**Severity**: medium
**Status**: open
**Area**: test
**Count**: 1

### Summary
Synthetic failure dedupe-test-1784560317795 — `node -e "process.exit(1)"`

### Error (snippet)
```text
unique-marker-dedupe-test-1784560317795 boom
```

### Prevention
Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regression test when durable, then re-run verify chain.

### Metadata
- Archive: n/a
- Healable: false


## [ERR-20260720-8e65] Synthetic failure dedupe-test-1784563612017

**Logged**: 2026-07-20T16:06:52.508Z
**Fingerprint**: `25101972bfa47152`
**Category**: general
**Severity**: medium
**Status**: open
**Area**: test
**Count**: 1

### Summary
Synthetic failure dedupe-test-1784563612017 — `node -e "process.exit(1)"`

### Error (snippet)
```text
unique-marker-dedupe-test-1784563612017 boom
```

### Prevention
Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regression test when durable, then re-run verify chain.

### Metadata
- Archive: n/a
- Healable: false


## [ERR-20260724-1ccd] Better Loop analysis: hooks referenced missing Python scripts

**Logged**: 2026-07-24T18:30:41.586Z
**Fingerprint**: `01d2d49d3a62de0b`
**Category**: general
**Severity**: medium
**Status**: open
**Area**: agent-os
**Count**: 1

### Summary
Better Loop analysis: hooks referenced missing Python scripts — `node scripts/hooks/run.mjs status`

### Error (snippet)
```text
hooks.json configured dev-healer PreToolUse/PostToolUse hooks pointing to .agents/plugins/dev-healer/hooks/*.py which do not exist on disk. Absolute Windows paths also reduce portability.
```

### Prevention
Use the existing Node.js hook system (scripts/hooks/run.mjs claude-pre-tool/claude-post-tool) with relative paths. Never reference scripts that do not exist in the repository.

### Metadata
- Archive: n/a
- Healable: false


## [ERR-20260724-ac80] Better Loop analysis: no delivery acceptance gate or recovery route documented

**Logged**: 2026-07-24T18:30:53.848Z
**Fingerprint**: `cdc37c64dd38640f`
**Category**: general
**Severity**: medium
**Status**: open
**Area**: delivery
**Count**: 1

### Summary
Better Loop analysis: no delivery acceptance gate or recovery route documented — `npx vercel rollback --yes`

### Error (snippet)
```text
CI validates code quality but no explicit acceptance decision or rollback procedure was documented. Failed deployments had no owned recovery path.
```

### Prevention
Always run npm run goal:verify before deployment. Recovery: npx vercel rollback --yes or npx vercel promote <deployment-url>. Owner: repo maintainer. Documented in AGENTS.md Delivery section.

### Metadata
- Archive: n/a
- Healable: false


## [ERR-20260724-bd35] Synthetic failure dedupe-test-1784917995150

**Logged**: 2026-07-24T18:33:15.252Z
**Fingerprint**: `e4babd7f10c9ebb4`
**Category**: general
**Severity**: medium
**Status**: open
**Area**: test
**Count**: 1

### Summary
Synthetic failure dedupe-test-1784917995150 — `node -e "process.exit(1)"`

### Error (snippet)
```text
unique-marker-dedupe-test-1784917995150 boom
```

### Prevention
Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regression test when durable, then re-run verify chain.

### Metadata
- Archive: n/a
- Healable: false


## [ERR-20260727-c43b] Synthetic failure dedupe-test-1785185896389

**Logged**: 2026-07-27T20:58:16.509Z
**Fingerprint**: `507e42ecfba6e3bd`
**Category**: general
**Severity**: medium
**Status**: open
**Area**: test
**Count**: 1

### Summary
Synthetic failure dedupe-test-1785185896389 — `node -e "process.exit(1)"`

### Error (snippet)
```text
unique-marker-dedupe-test-1785185896389 boom
```

### Prevention
Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regression test when durable, then re-run verify chain.

### Metadata
- Archive: n/a
- Healable: false


## [ERR-20260727-393e] Synthetic failure dedupe-test-1785187186553

**Logged**: 2026-07-27T21:19:46.744Z
**Fingerprint**: `5d101922a4d902e0`
**Category**: general
**Severity**: medium
**Status**: open
**Area**: test
**Count**: 1

### Summary
Synthetic failure dedupe-test-1785187186553 — `node -e "process.exit(1)"`

### Error (snippet)
```text
unique-marker-dedupe-test-1785187186553 boom
```

### Prevention
Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regression test when durable, then re-run verify chain.

### Metadata
- Archive: n/a
- Healable: false


## [ERR-20260727-1553] Synthetic failure dedupe-test-1785187405481

**Logged**: 2026-07-27T21:23:25.580Z
**Fingerprint**: `249c6f071065c46d`
**Category**: general
**Severity**: medium
**Status**: open
**Area**: test
**Count**: 1

### Summary
Synthetic failure dedupe-test-1785187405481 — `node -e "process.exit(1)"`

### Error (snippet)
```text
unique-marker-dedupe-test-1785187405481 boom
```

### Prevention
Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regression test when durable, then re-run verify chain.

### Metadata
- Archive: n/a
- Healable: false


## [ERR-20260727-a6e3] Synthetic failure dedupe-test-1785187697831

**Logged**: 2026-07-27T21:28:17.916Z
**Fingerprint**: `7fa19aeffc220ce6`
**Category**: general
**Severity**: medium
**Status**: open
**Area**: test
**Count**: 1

### Summary
Synthetic failure dedupe-test-1785187697831 — `node -e "process.exit(1)"`

### Error (snippet)
```text
unique-marker-dedupe-test-1785187697831 boom
```

### Prevention
Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regression test when durable, then re-run verify chain.

### Metadata
- Archive: n/a
- Healable: false


## [ERR-20260727-5972] Synthetic failure dedupe-test-1785187916135

**Logged**: 2026-07-27T21:31:56.580Z
**Fingerprint**: `ea8c39c88ea5a89a`
**Category**: general
**Severity**: medium
**Status**: open
**Area**: test
**Count**: 1

### Summary
Synthetic failure dedupe-test-1785187916135 — `node -e "process.exit(1)"`

### Error (snippet)
```text
unique-marker-dedupe-test-1785187916135 boom
```

### Prevention
Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regression test when durable, then re-run verify chain.

### Metadata
- Archive: n/a
- Healable: false

