# AGENTS.md

Project: **skysthelimit** — Sky's the Limit Painting LLC Website
Stack: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 + Payload CMS 3 + Supabase + Vercel

## Commands

```bash
npm ci
npm run dev          # http://localhost:3000
npm run lint         # git guard + react version + tsc
npm run lint:ci
npm test
npm run build
```

## Structure

- `src/app/` — Next.js App Router pages & API routes
- `src/components/` — UI and conversion components
- `src/views/` — Page bodies
- `src/lib/` — SEO, Supabase, env, analytics
- `src/payload.config.ts` — Payload CMS config (collections in `src/collections/payload`)
- `src/app/(payload)/` — Payload admin at `/admin`
- `scripts/` — sitemap, smoke, CI helpers
- `public/` — static assets, llms.txt, sitemap generated at build
- `supabase/` — migrations for leads, RLS, storage
- `tests/` — Node test suite (tsx --test)
- `.github/workflows/` — CI, deploy verification, security

## Conventions

- Next.js App Router, TypeScript under `src/`
- No emojis in product source; industrial UI (radius 0, trust colors)
- Root-cause fixes only; public claims must be verifiable (IR816596, insured)
- Conventional Commits, branch prefixes: feat/ fix/ chore/ docs/ infra/
- Verify before ship: `npm run lint:ci && npm test && npm run build`
