---
name: convex-development
description: Backend data modeling, query/mutation design, indexing, and migration patterns in Convex.
---

# Convex Platform Engineering Skill

## Workflow
1. Ground schema design via Context7 (`query-docs` on `/get-convex/convex`).
2. Define types in `convex/schema.ts` with strict validators.
3. Write functions with user authorization checks.
4. Run local test suite: `npx convex dev --dry-run` or local mock tests.
