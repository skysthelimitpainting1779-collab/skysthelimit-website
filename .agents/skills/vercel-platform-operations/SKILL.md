---
name: vercel-platform-operations
description: Use when inspecting, configuring, deploying, debugging, or verifying a Vercel project, deployment, environment, domain, runtime error, or preview.
---

# Vercel Platform Operations

Use the connected Vercel plugin before CLI assumptions.

Required sequence:
1. Inspect project and recent deployments.
2. Search official Vercel docs for the specific feature.
3. Perform local/preview-safe changes.
4. Inspect deployment, build logs, runtime errors, and preview URL.
5. Record deployment evidence and rollback reference.

Never promote, alias, mutate production settings, or change domains without the named gate. Treat Vercel connector results as platform truth and CLI as implementation support.
