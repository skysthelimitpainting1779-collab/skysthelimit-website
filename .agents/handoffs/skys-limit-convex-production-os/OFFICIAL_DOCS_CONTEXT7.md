# Vercel Platform Sources

For every Vercel task, use the connected Vercel plugin's documentation search in addition to Context7.

Required current topics:

- Vercel Services project framework and `vercel.json` schema
- service roots, internal services, rewrites, and service bindings
- Marketplace Integration resource inventory/connect/environment scoping
- Vercel Connect project links
- Workflow runtime and service placement
- preview deployments, build logs, runtime errors, protected preview access
- environment variables and production/preview/development separation
- production promotion and rollback

Confirmed official patterns used by this package:

- Vercel Services can define multiple services and route to them with service destinations.
- Services without public rewrites remain internal.
- Service bindings inject an internal service URL into a named environment variable.
- Marketplace resources can be inventoried with `vercel integration list --format=json`.
- Resources can be connected to selected environments and prefixed to avoid variable collisions.
- The current project must be changed from the `nextjs` preset to the `services` preset for Services configuration to become active; production conversion remains gated.


# Current Official Documentation Anchors

Use Context7 or an official connector before implementing an integration. Do not rely on model memory when current primary documentation is available.

## Convex

- **Context7 library ID:** `/websites/convex_dev`
- **Query already verified:**  
  `How to integrate Convex with Clerk in a Next.js App Router application: auth configuration, provider setup, authenticated server/client calls, identity token validation, and recommended authorization checks inside Convex functions.`
- Confirmed:
  - `convex/auth.config.ts` declares the Clerk issuer and `applicationID: "convex"`.
  - `ClerkProvider` wraps the Convex provider.
  - Convex functions call `ctx.auth.getUserIdentity()` and enforce authorization server-side.
- Query current docs separately for schema/indexes, file storage, HTTP actions, scheduling, migrations, deployment, and testing.

## Clerk

- **Context7 library ID:** `/clerk/clerk-docs`
- **Query already verified:**  
  `How to protect Next.js App Router routes with Clerk middleware/proxy, require invitation-only staff access, enforce MFA for privileged roles, and synchronize user lifecycle changes to an application backend using verified Clerk webhooks.`
- Confirmed:
  - Use Clerk's current Next.js middleware/proxy pattern.
  - Verify lifecycle webhooks with Clerk's official helper.
  - Server route checks complement but do not replace Convex resource authorization.
  - Lifecycle events must create/update/disable mapped application users.

## Vercel Workflow

- **Context7 library ID:** `/vercel/workflow`
- **Query already verified:**  
  `How to implement durable Next.js workflows for external side effects with step functions, retries, idempotency, waits, webhook or human-event resumption, observability, and safe error handling.`
- Confirmed:
  - `"use workflow"` marks durable, resumable workflows.
  - `"use step"` marks cached, retryable steps.
  - Use step IDs as provider idempotency keys where supported.
  - Classify permanent and retryable failures explicitly.
  - Use durable hooks for verified external events and human approvals.

## Retrieve current primary docs before these nodes

- Next.js 16 App Router, Cache Components, proxy, metadata, and route groups
- Stripe Checkout Sessions and verified webhooks
- shadcn/ui source-owned components
- Supabase export, storage, auth, and rollback
- Vercel deployment, environment, preview, promote, and rollback
- Cal.com API/webhooks
- Selected SMS provider
- Playwright, axe, and WCAG 2.2 AA
