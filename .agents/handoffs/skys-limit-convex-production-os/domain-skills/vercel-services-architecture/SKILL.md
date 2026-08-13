---
name: vercel-services-architecture
description: Use when introducing or changing Vercel Services, service roots, service bindings, internal services, rewrites, framework presets, or multi-service deployment boundaries.
---

# Vercel Services Architecture

Retrieve current Vercel Services documentation before editing configuration.

Rules:
- Each service needs a justified runtime, security, dependency, or deployment boundary.
- Internal services remain unreachable unless an explicit rewrite exposes them.
- Use service bindings for internal URLs; do not hardcode deployment hostnames.
- Validate the project framework preset and current `vercel.json` Services schema.
- First deploy Services topology to preview.
- Verify every service build and runtime independently.
- Production framework conversion is separately gated.

Target pattern: `web` Next.js service plus internal `integrations` TypeScript service for verified webhooks and durable external-effect entrypoints.
