---
name: convex-local-deploy-validation
description: Generate Convex bindings, push functions to an anonymous local backend, and typecheck the deployed function graph. Use whenever Convex schema, auth config, HTTP actions, or exported functions change, and before claiming a Convex backend is deployable.
---

# Convex Local Deploy Validation

1. Confirm every direct child module under `convex/` uses only letters, numbers, underscores, or periods. Rename hyphenated modules and update imports.
2. Run `CONVEX_AGENT_MODE=anonymous npx convex dev --once` (PowerShell: set `$env:CONVEX_AGENT_MODE='anonymous'` first). The first run creates `.env.local` and the local deployment.
3. If auth config reports missing deployment variables, set non-secret local validation values with `npx convex env set <NAME> <VALUE>`. Never copy preview or production secrets into the local deployment.
4. Repeat `convex dev --once` until the backend reports a successful function push. Treat config, bundling, schema, and generated-type failures as blockers.
5. Run `npx tsc -p convex/tsconfig.json --noEmit`, then the repository TypeScript check.
6. Keep generated `convex/_generated/` bindings. Do not commit `.env.local`, local backend state, or credentials.

Record the push result, typecheck result, and any required live-environment variables in the goal evidence. A local push proves deployability, not production configuration.
