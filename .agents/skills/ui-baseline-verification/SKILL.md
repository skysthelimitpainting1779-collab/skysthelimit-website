---
name: ui-baseline-verification
description: >
  Run the repository-owned Playwright, axe, touch-target, and screenshot
  baseline before closing a user-facing UI node. Use for STL-301 and every
  later UI batch that changes shared tokens or primitives.
---

# UI baseline verification

## Prerequisites

- Read `AGENTS.md` and query Graphifyy for the active UI node.
- Use Context7 for current Playwright, axe-core, shadcn, Tailwind, or Motion
  contracts before changing the gate.
- Keep the run local. Do not deploy, promote, migrate, or use production data.

## Run

1. Run `npm run lint:design:all`.
2. Run `npm run lint:slop:all`.
3. Run `npm run lint:types`.
4. Run `npm run test:ui-baseline`.
5. Run `npm test` for SEO crawl and repository regressions.

Update snapshots only after an intentional, reviewed design-system change:

```bash
npm run test:ui-baseline -- --update-snapshots
npm run test:ui-baseline
```

## Acceptance

- Both desktop and mobile Chrome projects pass.
- Axe reports zero violations for the semantic primitive fixture.
- Every tested control is at least 44px high.
- Screenshot comparison passes without a diff.
- Type, design, anti-slop, SEO crawl, and repository tests pass.

## Evidence and recovery

Record exact counts and snapshot paths in the active node evidence file. If the
web server cannot start, verify the PID belongs to this worktree before stopping
it, then rerun on the dedicated Playwright port. Never soften assertions or
delete a failing baseline to obtain a pass.
