---
trigger: always_on
description: Host-native specialists map for Antigravity (see specialists.json).
---

# Specialists (host-native)

SSOT: `.agents/specialists.json` · compile: `npm run host:compile`

Skills SSOT: `.agents/skills/` (Agent Skills standard).

- **frontend-vercel**: Next.js App Router — pages, layouts, RSC, data fetching, routing, Next config under src/app and lib. Do NOT use for src/components/ui or src/app/api.
  - Allow: `src/app/**`, `src/lib/**`, `src/views/**`, `src/data/**`
- **ui-ux**: Design system and UI primitives under src/components/ui, animations, global CSS. Do NOT use for app routes or API.
  - Allow: `src/components/ui/**`, `src/components/animations/**`, `src/app/globals.css`, `src/index.css`
- **api**: Convex business-state functions, integration boundaries, and Next.js route handlers. Do NOT use for UI components.
  - Allow: `src/app/api/**`, `src/lib/*supabase*`, `src/lib/*db*`, `src/lib/*lead*`
- **seo**: Metadata, JsonLd, sitemap, robots, AI crawlability. Use for SEO/meta/sitemap work.
  - Allow: `src/lib/seo*`, `src/components/JsonLd*`, `src/components/PageMeta*`, `src/app/**/page.tsx`
- **content-market**: Market/service pages, LeadForm, conversion-facing views and copy structure.
  - Allow: `src/views/**`, `src/data/**`, `src/components/LeadForm*`, `src/components/MarketPage*`
- **ci-devops**: GitHub Actions, husky, Vercel config, CI scripts, package.json scripts. Do NOT edit src product UI.
  - Allow: `.github/**`, `.husky/**`, `vercel.json`, `knip.json`
- **agent-os**: AGENTS.md, host-native compile, hooks, learn scripts, graph-context, .learnings. Do NOT edit product src.
  - Allow: `.agents/**`, `.claude/**`, `.cursor/**`, `.codex/**`

Always obey root **AGENTS.md**. Never bulk-load wiki/GRAPH_REPORT.
