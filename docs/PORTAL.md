---
type: documentation
title: Client Portal + OAuth
description: Supabase Auth portal for clients to view their estimate leads.
tags: [portal, oauth, vercel]
---

# Client Portal + OAuth

> **Portal stack:** Next.js 16 on Vercel Fluid + **Supabase Auth** (Google + GitHub) + **`src/proxy.ts`** proxy. CMS is **Payload 3** in-app at `/admin` (Payload config: `src/payload.config.ts`). Directus has been decoupled and removed.

## Stack

| Decision | Choice |
|----------|--------|
| CMS | **Payload 3** inside Next at `/admin` (Blob + pooled Postgres) |
| Site host | **Next.js 16 on Fluid** + **Node 24** |
| Session / OAuth | **Supabase Auth** (Google + GitHub) + **`src/proxy.ts`** |
| Env | `NEXT_PUBLIC_*` public only; secrets via `vercel env` (Sensitive) |
| Redirect URL | `{SITE}/auth/callback` (allow-list in Supabase + provider console) |

## Portal routes

| Route | Access |
|-------|--------|
| `/portal/login` | Public |
| `/portal` | **Protected** — redirect to login if no session |
| `/auth/callback` | OAuth code exchange |
| `/auth/signout` | POST sign-out |

Portal data: leads in Supabase where `email` matches the signed-in user (estimate requests).

### OAuth setup

1. Supabase Dashboard → Authentication → Providers → enable **Google** and/or **GitHub**.
2. Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://www.skysthelimitpaintingllc.com/auth/callback`
   - Preview: `https://*.vercel.app/auth/callback`
3. App env:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
4. User flow: `/portal/login` → `signInWithOAuth` → IdP → `/auth/callback` → session cookie → `/portal`

### RLS (required)

Migration `supabase/migrations/20260709210000_portal_leads_select_by_email.sql`:
```sql
lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
```
Apply via `supabase db push` or SQL editor. Without this, authenticated users see **zero** leads.

## Verify

```bash
npm test -- tests/portal-auth.test.mjs tests/portal-data.test.mjs
npm run lint:types
```
