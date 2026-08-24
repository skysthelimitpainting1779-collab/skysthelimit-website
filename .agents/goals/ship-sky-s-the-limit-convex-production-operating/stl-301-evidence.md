# STL-301 — Design tokens/shadcn baseline

Status: verified

## Acceptance

The source-owned shadcn baseline now has a repeatable WCAG and visual-regression
gate. The gate exercises the compiled semantic tokens at desktop and mobile
breakpoints, runs axe against WCAG 2.0/2.1/2.2 AA tags, asserts 44px minimum
control heights, and compares deterministic reduced-motion screenshots.

The shared `Button` and `Input` primitives use a 44px minimum interactive
height. Industrial radius-zero geometry remains unchanged because it is an
explicit repository style rule.

## Context7 contracts

- `/shadcn-ui/ui`: `components.json` owns the CSS path, aliases, base color,
  and `cssVariables: true` semantic-token contract.
- `/tailwindlabs/tailwindcss.com`: Tailwind v4 exposes design tokens as CSS
  variables and uses `@theme inline` when theme values reference CSS variables.
- `/websites/motion_dev`: React imports come from `motion/react`; reduced
  motion must remove transform/layout motion while preserving usable state.
- `/microsoft/playwright/v1.61.0`: `webServer` provides the tested local app;
  named desktop/mobile projects use Chrome; `toHaveScreenshot` owns snapshot
  comparison.
- `/dequelabs/axe-core`: WCAG levels use distinct tags. The gate includes
  `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, and `wcag22aa`.

## Verification

- `npm run test:ui-baseline`: PASS, 2 passed, 0 failed.
- `npm run lint:types`: PASS, exit 0.
- `npm test`: PASS, 390 passed, 0 failed, 0 skipped.
- SEO crawl coverage inside `npm test`: PASS, including Tier 4 static SEO
  crawler and sitemap/schema checks.
- `npm run lint:design:all`: PASS, 83 files, 0 errors, 0 warnings,
  design SHA-256 `c40220b22064bc083bd51787488bb04051edf7cfaac27d3c8a367a86f2182ae0`.
- `npm run lint:slop:all`: PASS, 83 files, 0 findings.
- `npm run verify:ui-design-evidence`: PASS, 1 verified node.
- `npm run context7:verify`: PASS.
- `node scripts/validate-graph.mjs .graph/graph.json` before status update:
  PASS, 66 nodes, 204 edges, no errors or warnings.

## Visual evidence

- `tests/ui-baseline.spec.ts-snapshots/design-system-desktop-chrome-win32.png`
- `tests/ui-baseline.spec.ts-snapshots/design-system-mobile-chrome-win32.png`

## Review and safety

Independent review identified the missing executable browser/axe/snapshot gate;
the implementation closes that gap. A post-change independent review is
required before the execution graph status is changed.

No deployment, provider mutation, migration, production data access, promotion,
or cutover occurred.
