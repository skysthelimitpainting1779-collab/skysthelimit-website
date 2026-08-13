# GitHub Repository Audit Snapshot

- **Repository:** `skysthelimitpainting1779-collab/skys-the-limit-painting-llc-website`
- **Default branch:** `main`
- **Audited commit:** `c7e94605eefdace7a76ce5145808478df8503dbb`
- **Commit timestamp:** `2026-07-25T22:00:15Z`
- **Source:** connected GitHub repository plus the uploaded migration audit and execution graph

## Confirmed priority findings

1. **Control-plane mismatch:** RPI goal and Graphify implementations exist, but `package.json` does not expose their required commands.
2. **Architecture mismatch:** `.agents/STACK.md` rejects the approved Convex migration.
3. **Silent lead-loss path:** canonical persistence failure is swallowed while the route can return success.
4. **Broken estimate submission:** the estimate page omits required lead fields.
5. **Unprotected legacy operator surface:** `/manage` permits sign-up and browser-side CRUD.
6. **Public customer files:** lead-photo upload returns a permanent public URL.
7. **Review gating:** only ratings four and five receive the Google review path.
8. **PII leakage:** full leads use localStorage and referral emails appear in URLs and analytics.
9. **Split content authority:** Directus, Supabase, static content, and Payload overlap.
10. **Weak ownership model:** portal resources are associated by email-string matching.
11. **Tests preserve unsafe behavior:** some tests explicitly assert review gating and raw PII persistence.
12. **Target dependencies are absent:** Convex, Clerk, Stripe, and Vercel Workflow are not installed.

## What is already reusable

- Substantial Next.js 16/React 19 public application
- Existing conversion forms, estimate UI, route pages, design assets, and shadcn primitives
- Supabase data and migration history usable as migration input
- Payload/Directus schemas and content usable as migration input
- Existing test harness, CI, Entire checkpoints, Agent OS, goal loop, Graphify wrapper, and Graph Engineer package

## Local-command limitation

This environment audited GitHub content directly but did not clone and execute the repository. The Codex handoff therefore requires `npm ci`, Graphify validation, lint, tests, and build **before any code edit**, with pre-existing failures recorded separately.
