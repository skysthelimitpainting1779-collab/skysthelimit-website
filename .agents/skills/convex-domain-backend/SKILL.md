---
name: convex-domain-backend
description: Use when designing or implementing Convex schemas, indexes, queries, mutations, actions, HTTP actions, scheduling, files, migrations, events, idempotency, or audit records.
---

# Convex Domain Backend

Query current Convex documentation through Context7 before implementation.

Rules:
- Model access patterns and indexes before tables.
- Enforce authorization inside every exposed Convex function.
- Keep external effects outside database mutations.
- Use canonical entity IDs, idempotency records, immutable events, and append-only audit facts.
- Use HTTP actions only for verified external boundaries.
- Separate development, preview, and production deployments.
- Test cross-tenant denial, retry, duplicate, and migration cases before UI integration.
