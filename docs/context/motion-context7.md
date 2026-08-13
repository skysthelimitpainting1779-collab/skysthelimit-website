# Motion Context7 Record

**Checked:** 2026-07-30  
**Selected library:** `/websites/motion_dev`  
**Source reputation:** High

## Contracts used

- Motion for React imports from `motion/react`.
- In the Next.js App Router, hook-based Motion components use a `"use client"` boundary.
- Server-compatible component usage may import from `motion/react-client` to reduce client JavaScript where hooks and interactive gesture state are not required.
- The legacy `framer-motion` import path is not used for new foundation code.

## Foundation decision

Reusable interactive primitives use `motion/react` because they call `useReducedMotion` and support gestures. Static server-rendered animation wrappers may later use `motion/react-client` after bundle and behavior verification.

## Verification requirements

- TypeScript compilation succeeds against the installed `motion` package.
- Reduced-motion behavior is covered by tests or component-level verification.
- No essential content depends on animation completion.
- New Motion APIs require a fresh Context7 lookup and an update to this record or a feature-specific context record.
