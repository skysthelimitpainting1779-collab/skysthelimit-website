# GitHub Evidence Manifest

**Repository:** `skysthelimitpainting1779-collab/skys-the-limit-painting-llc-website`  
**Historical baseline commit (not current HEAD):** `c7e94605eefdace7a76ce5145808478df8503dbb`

| Path | Blob SHA | Verified finding |
|---|---|---|
| `package.json` | `de2d827b9da068f0e20a377277367efe6f409750` | Next 16.2.10, React 19.2.7, Payload, Directus, Supabase and Resend are installed; Convex, Clerk, Stripe and Workflow are absent; goal and Graphify scripts are not exposed. |
| `README.md` | `a9fa367c23b47482ba3e42ce5b269ac801f1f0ac` | Documents the current Supabase/Payload-era target and commands that do not match package.json. |
| `.env.example` | `f958ed8aa6c1f70a28d1daa735c12e9d748e9222` | Documents Supabase, Directus, Resend, Cal.com and Agent OS variables but omits the approved target integrations. |
| `AGENTS.md` | `083155d67247e626d5186515fd9c7bccd1eabe24` | Requires Graphify-first discovery and goal verification while retaining stale global design constraints. |
| `.agents/STACK.md` | `f9baa49d294ba697d5203753afa6696ec6e4fe15` | Explicitly rejects a full Convex migration and therefore conflicts with the approved architecture. |
| `.agents/specialists.json` | `9694f6c2d90132c3a3d9bf642f8494ce663f3f2f` | Generated specialists still route API and frontend work toward Supabase and the old design rules. |
| `.codex/config.toml` | `3d76ec0a6180fc73782cc689bb4289602153cd86` | Only enables hooks; no economy, concurrency, verbosity, or Graphify defaults are defined. |
| `.agents/mcp_config.json` | `4051b149a734ba786b79c51b403a3bdbdb44b665` | Graphify is bound to one absolute Windows path. |
| `scripts/goal.mjs` | `0a9c46e2aeaf8d577326801ae548ad700e5d01ea` | Implements the complete RPI goal loop, but package.json does not expose it. |
| `scripts/graph-context.mjs` | `8e5dfff950b423d87fd67d8c2eeff6b2369300f0` | Implements budgeted Graphify query/path/explain/update commands, but package.json does not expose them. |
| `.agents/skills/ship-loop/SKILL.md` | `ba3ae874a4d27e009a66f97b36f56ac798088b67` | Defines /goal as research-plan-implement with deterministic verification. |
| `next.config.ts` | `a9bb72457efa0cb767b8af6280a636aea8b9e8a7` | Wraps the app with Payload and permits public Supabase storage and Directus assets. |
| `vercel.json` | `82aa288e6ea09e07d0d11002e42ebc35ff44a074` | Contains current security headers, redirects, SEO cron, and legacy provider host allowances. |
| `src/proxy.ts` | `d6e22ed9a94b931552c9b01283bc3b5a2639da73` | Protects the Supabase portal but does not protect /manage. |
| `src/app/api/leads/route.ts` | `4bb23e2902b066a6f8784c7a60f02f4f92296d90` | Persistence errors are logged and swallowed before the route returns success; provider effects execute inline. |
| `src/lib/api/utils.ts` | `8395b30f60f54e0270acaae1c5b76f13e73b1f58` | Requires market, timeline, and contactMethod and uses a process-local Map rate limiter. |
| `src/components/LeadForm.tsx` | `bee6adc576f7123fedbb3cfa1cc36ba2ae353fd6` | Stores complete unsent leads in localStorage and receives permanent public photo URLs. |
| `src/views/Estimate.tsx` | `d58cda39645352533d3d032fa5fff165aec4cfd1` | Submits an incomplete lead payload without required market, timeline, and contactMethod fields. |
| `src/app/manage/layout.tsx` | `10a7d1af043593c3a1e38cf9e01777a935fd25e8` | Sets noindex metadata but is not an authorization boundary. |
| `src/app/manage/page.tsx` | `86a6e40c0da5d6c37a6e62c47db3943cb74b1a78` | Client-side Supabase admin permits sign-up and browser CRUD against business/content tables. |
| `src/app/api/storage/upload-url/route.ts` | `273b30585d6e8a209bbaf2903187a04bb04f1089` | Returns a signed upload URL plus a permanent public lead-photo URL. |
| `src/views/Review.tsx` | `eeb4eefa427a9686964ac7d7ac76837019b48061` | Only ratings four and five receive the Google-review path. |
| `src/views/Refer.tsx` | `8686bc389b56e80c920633effd2ab10b381109d9` | Places the referrer's email in the referral URL and analytics payload. |
| `src/app/painting-services/[slug]/page.tsx` | `cc0412b0d2fb4a99723034428bb680fbba0e6b15` | Returns notFound for slugs absent from the static service-page registry. |
| `src/data/landingPages.ts` | `49fa2545c3fd02788e81b0691ebfe307dad815a6` | Acts as a static service/location route registry that can drift from navigation, redirects, and sitemap. |
| `src/views/Projects.tsx` | `ebdaefca128abf75670424deae5fa6b9944648a7` | Uses Directus, then Supabase, then static fallbacks, creating three publication sources. |
| `src/lib/directus/client.ts` | `865725ea2e94bddc08ec8e2719efdac6b7092c3d` | Directus remains an active content adapter. |
| `src/payload.config.ts` | `5c2470ecf480c3df644b2e556727986022a1de51` | Payload uses Supabase Postgres and S3 and includes an unsafe known-secret fallback. |
| `src/lib/auth/portal-data.ts` | `858e36aafe648ed256b7229a92159aef9346b07c` | Associates portal resources to authenticated users by matching email strings. |
| `src/lib/analytics.ts` | `c207071ac3f6121152abdaab832729e5477f2173` | Only emits browser events and cannot reconcile events to canonical revenue facts. |
| `src/app/api/manychat/route.ts` | `01d55738636270edbe6de6781836803265f24462` | Executes delivery effects without first creating a canonical durable lead. |
| `tests/e2e.test.mjs` | `1abb134875cc8b1814ee205a19c9d7fdc836e458` | Several tests explicitly require unsafe legacy behavior, including review gating and PII browser persistence. |
| `docs/SYSTEM_MAP_E2E.md` | `4f4553cf1c2697decdf7377439ffd66a8b01957c` | Provides a useful but stale Supabase/Payload architecture map. |
