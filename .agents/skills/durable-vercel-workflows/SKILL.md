---
name: durable-vercel-workflows
description: Use when implementing durable external effects, retries, waits, provider calls, approval hooks, scheduled sequences, or replayable business workflows with Vercel Workflow.
---

# Durable Vercel Workflows

Query `/vercel/workflow` in Context7 and Vercel official docs first.

- Use workflow functions for durable resumable orchestration.
- Use step functions for cached retryable effects.
- Persist business state in Convex, not workflow-local memory.
- Send provider idempotency keys.
- Separate fatal validation failures from retryable provider failures.
- Record attempts and final outcomes.
- Use durable hooks for verified provider or human resume events.
- Test retry, duplicate, timeout, cancellation, and replay.
