---
type: knowledge
title: Approved target stack
description: Convex, Clerk, Vercel Services, Next.js 16, and migration-only legacy systems.
tags: [stack, vercel, nextjs, convex, clerk, workflow]
version: 3.0.0
---

# Approved target stack

Authority: [CURRENT_DECISIONS.md](CURRENT_DECISIONS.md). Current official documentation and connector evidence override remembered platform syntax.

## Platform

```text
Vercel project: website
├── web
│   ├── Next.js 16 / React 19 / Node 24
│   ├── marketing routes
│   ├── customer portal routes
│   └── operator routes
└── integrations
    ├── TypeScript / Hono
    ├── verified provider webhooks
    ├── integration adapters
    └── Vercel Workflow entrypoints
```

- Vercel Services uses the current stable `services` schema, explicit public rewrites, and internal service bindings.
- Preview validation precedes any production framework conversion.
- Convex scheduling handles deterministic internal work; Vercel Workflow handles durable external effects.

## Data, identity, and authorization

| Concern | Target |
|---|---|
| Operational state | Convex |
| Identity | Clerk |
| Authorization | Convex resource grants |
| Audit/events/idempotency | Convex |
| Payments | Stripe-hosted Checkout Sessions |
| Transactional email | Resend through durable workflows |
| Booking | Cal.com synchronization through verified webhooks |
| Public application | Next.js App Router |
| Integrations boundary | Internal TypeScript/Hono Vercel service |

Supabase, Payload, Directus, their databases, and legacy storage remain migration sources and rollback dependencies until the cutover and retention gates clear. Do not add new product behavior to them.

## UI and public platform

- Source-owned shadcn/ui components with Measured Craft composition.
- Orange/charcoal brand with semantic geometry tokens.
- WCAG 2.2 AA, keyboard access, visible focus, reduced motion, and responsive layouts.
- One route registry drives pages, navigation, canonicals, sitemap, robots, and redirects.

## Security and privacy

- Authenticated data is server-authorized; browser code receives minimal DTOs.
- Customer files are private unless explicitly published.
- No raw PII in browser persistence, referral URLs, analytics, logs, or public file URLs.
- External boundaries verify signatures over raw bodies and deduplicate provider event IDs.
- Live payments, communications, production data changes, deployment promotion, domains, GBP edits, and decommissioning require named approval gates.
