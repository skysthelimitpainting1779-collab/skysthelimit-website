---
name: award-winning-ui-orchestration
description: Use for non-trivial UI work that must combine shadcn, Motion, Convex compatibility, accessibility, and independent design review.
---

# Award-Winning UI Orchestration

Apply this workflow to every non-trivial interface node.

## Required Skill Chain

Read and apply these repository skills before implementation:

1. `impeccable`
2. `ui-ux-pro-max`
3. `shadcn-measured-craft`
4. `motion`
5. `clerk-convex-authorization`
6. `anti-slop-ui-review`

Use Graphify for bounded code discovery. Use Context7 for current framework
contracts and the official shadcn MCP for component discovery. Prefer
source-owned shadcn primitives and the independent modules in `registry.json`.

## Architecture Rules

- Keep the Next.js root layout server-rendered.
- Mount Convex and Clerk only through the existing client provider boundary.
- Do not create a second Convex provider, client singleton, schema, or data layer.
- Keep reusable presentation components independent of Convex. Pass typed data or
  render them below an existing query boundary.
- Import animation APIs from `motion/react`. Every animation primitive must
  handle `useReducedMotion` at its component boundary.
- Use semantic tokens, zero letter spacing, visible focus states, and stable
  responsive dimensions. Do not split display words to force a composition.

## Two-Agent Gate

Assign one executor and one independent verifier to the node. Their write scopes
must not overlap. The independent verifier reviews desktop and mobile behavior,
keyboard/focus states, reduced motion, contrast, overflow, and visual hierarchy.
Only the lifecycle checkpoint owner may integrate and complete the node.

## Completion

Run focused tests first, then lint, the full test suite, production build, and
browser verification at desktop and mobile widths. Record screenshots and the
independent verifier's findings in checkpoint evidence.
