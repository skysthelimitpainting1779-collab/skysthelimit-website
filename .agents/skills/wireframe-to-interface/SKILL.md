# Wireframe to Interface

## Trigger
Use for any new page, dashboard surface, conversion flow, or substantial layout change.

## Required context
Read `AGENTS.md`, `.agents/CURRENT_DECISIONS.md`, the relevant wireframe, and no more than three initial implementation files. Query Context7 for any external UI API being changed.

## Procedure
1. Identify the page goal, primary user, primary action, proof requirements, and failure states.
2. Confirm desktop and mobile information order before styling.
3. Write a focused test or acceptance contract that fails for the missing surface.
4. Reuse source-owned shadcn components and existing design tokens.
5. Implement semantic HTML without requiring animation for comprehension.
6. Apply Motion only after static structure, keyboard flow, and responsive behavior pass.

## Test and verification
Run focused tests, `npm run lint:ci`, relevant accessibility checks, responsive screenshots, and the canonical Vercel Preview.

## Stop conditions
Stop when the wireframe is ambiguous, required content is unverified, provider effects are unclear, or the mobile hierarchy differs materially without approval.

## Evidence
Record wireframe path, Context7 library IDs, test commands, responsive viewport results, accessibility findings, exact commit SHA, and Preview URL.
