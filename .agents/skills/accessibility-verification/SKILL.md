# Accessibility Verification

## Trigger
Use for every user-facing interface change and before release acceptance.

## Required context
Read the relevant wireframe, component code, and project accessibility requirements. Query Context7 when an external component or framework API affects semantics, focus, or reduced motion.

## Procedure
1. Inspect landmarks, headings, labels, names, roles, states, and error associations.
2. Verify keyboard-only operation and visible focus.
3. Check contrast, zoom, reflow, touch targets, and screen-reader announcements.
4. Verify reduced-motion behavior and that essential content is never animation-dependent.
5. Check image alternative text and publication classification.

## Test and verification
Run available automated accessibility tests, focused component tests, keyboard verification, reduced-motion verification, responsive checks, and canonical Vercel Preview inspection.

## Stop conditions
Stop for keyboard traps, missing accessible names, invisible focus, unannounced errors, insufficient contrast, motion without a reduced alternative, or essential content unavailable to assistive technology.

## Evidence
Record test output, manual keyboard path, reduced-motion result, Context7 references, unresolved findings, exact commit SHA, and Preview URL.
