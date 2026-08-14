---
trigger: always_on
description: Vercel configuration rules, build verification, and deployment safety.
---

# Vercel Platform Rules

1. Always query Context7 on `/vercel/next.js` or `/websites/vercel` before editing `vercel.ts` or `next.config.ts`.
2. Direct production deployments via CLI are hard-denied; all promotions flow through GitHub PR and the release workflow.
3. Validate build output cleanly via `npm run build` before candidate handoff.
