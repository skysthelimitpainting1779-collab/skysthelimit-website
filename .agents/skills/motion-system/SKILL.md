# Motion System

## Trigger
Use when adding, changing, or reviewing animation, gesture, layout transition, or scroll-linked behavior.

## Required context
Read `docs/design/MOTION_SYSTEM.md`, `src/design/motion/*`, and the relevant component. Query Context7 using `/websites/motion_dev` for the exact Motion API before implementation.

## Procedure
1. State the user-facing purpose of the motion.
2. Write a focused test or acceptance check for the intended state transition.
3. Use shared tokens and primitives before adding a new pattern.
4. Prefer transform and opacity.
5. Add `useReducedMotion` behavior for every interactive primitive.
6. Verify keyboard, touch, focus, and no-JavaScript content order.

## Test and verification
Run the focused test, TypeScript checks, visual regression at mobile and desktop widths, reduced-motion verification, and the canonical Vercel Preview.

## Stop conditions
Stop for decorative motion without a user purpose, essential content hidden behind completion, layout-thrashing properties, scroll hijacking, or an undocumented Motion API.

## Evidence
Record Context7 source, affected primitives, reduced-motion result, performance observation, tests, exact commit SHA, and Preview URL.
