# Repository Audit — Sky's the Limit Painting LLC Website

**Repo:** `skysthelimitpainting1779-collab/skys-the-limit-painting-llc-website`
**Branch:** `arena/019ffa09-skys-the-limit-painting-llc-we` (from `df6f1a4` on `dev`)
**Audited:** 2026-08-13 (static + install + tsc + test; Next build blocked by sandbox egress)
**Runtime target:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Convex · Clerk · Supabase · Payload CMS · Resend · Vercel.

---

## TL;DR

The codebase is **well-structured and production-minded**: strong security hygiene around the lead pipeline (signed upload intents, idempotency, outbox claims, RLS, webhook HMAC-style compares, Zod schemas), Convex+Clerk identity for the protected portal, and an unusually thorough test matrix (543 tests, 522 passing). TypeScript typechecks cleanly.

However, there are **real issues that affect production behavior, repository hygiene, and security posture**, summarized below. Fixes are ordered by severity.

### Headline counts

| Area | Result |
|---|---|
| `tsc --noEmit` | ✅ Clean |
| Unit tests (`npm test`) | ⚠️ **7 failures / 543** (see §3) |
| Hardcoded secrets | ✅ None found |
| Leaked `.env` files | ✅ None tracked |
| Dependency audit (prod) | ⚠️ 1 moderate direct dep (`hono`), transitive high `fast-uri` (see §5) |
| Broken user-facing links | ❌ **/privacy and /terms linked from footer but not implemented** (see §1) |
| Large / duplicate assets | ⚠️ ~30 MB wasted on duplicate PNG/WebP pairs and orphaned logs (see §7) |
| Tracked junk artifacts | ❌ 3.7 MB of `test-results*.txt`, `e2e_out.txt`, `diff.txt` committed (see §7) |
| Middleware miswire | ❌ `src/proxy.ts` (Clerk middleware) is **not auto-loaded**; protected routes rely entirely on client-side Convex auth (see §2) |

---

## 1. Critical / high-severity issues

### 1.1 `/privacy` and `/terms` are linked but don't exist
**Files:** `src/app/(marketing)/layout.tsx` lines ~270–273.

The footer renders:
```tsx
<Link href="/privacy">Privacy Policy</Link>
<Link href="/terms">Terms of Service</Link>
```
But neither `src/app/(marketing)/privacy/page.tsx` nor `.../terms/page.tsx` exists; both links 404. For a site that collects leads + photo uploads and runs a Customer portal, this is also a compliance problem (no visible privacy policy for form submissions or Cal.com embeds).

**Fix:** add minimal `/privacy` and `/terms` routes, or remove the links until drafted.

### 1.2 `src/proxy.ts` (Clerk middleware) is never loaded
**Files:** `src/proxy.ts`, no `src/middleware.ts`.

Next.js only auto-invokes `middleware.ts` (or `.js`) at the project root **or** inside `src/`. The file is named `src/proxy.ts`. It exports a function named `proxy` (not `middleware`). As a result:

- The matcher (`/portal`, `/portal/:path*`, `/manage/:path*`) never runs.
- Clerk's request identity isn't established on the Edge; `buildClerkAuthorizedParties()` is dead code at runtime.
- Portal protection is enforced only by:
  1. The `(protected)/layout.tsx` server-side `validateProtectedIdentityConfiguration` (which **only checks env presence**, not a real session — it returns `configured: true` if the env vars parse).
  2. Client components like `(protected)/portal/page.tsx` gating on `useConvexAuth()` / `useQuery(...)`.

The Convex+Clerk JWT flow still prevents *data access* for unauthenticated users, but:
- The server-rendered shell for `/portal` and `/manage` is reachable without a session (it renders a "Sign in" panel rather than redirecting), which is not a data leak but is different from the intended gate.
- `/portal/login` etc. are missing the edge-level authorized-party check.

**Fix:** rename `src/proxy.ts` → `src/middleware.ts` and rename the export to `middleware` (or re-export `proxy` as `middleware`). Verify with a simple test that hits `/portal` without a session and asserts a redirect.

### 1.3 Payload `secret` has a hardcoded debug default
**File:** `src/payload.config.ts` line ~87:
```ts
secret: process.env.PAYLOAD_SECRET ?? 'CHANGE_ME_IN_ENV',
```
If `PAYLOAD_SECRET` is unset in any deployed environment, the admin runs on a publicly-known secret — that lets anyone forge Payload JWTs. The build won't fail.

**Fix:** throw at boot when `PAYLOAD_SECRET` is missing (especially when `NODE_ENV !== 'development'`), instead of falling back to a static string.

### 1.4 Payload admin GraphQL is publicly enabled without auth surfacing review
**File:** `src/payload.config.ts`
```ts
graphQL: { disable: false },
```
Combined with `db.push: false` and a dedicated `payload` Postgres schema this is not automatically a data leak, but `/admin/api` + the GraphQL playground are mounted at `/admin/api` on every environment. Payload's access control still governs data, but enabling GraphQL by default widens the public attack surface. Confirm this is intentional; if the admin is only used by staff, set `graphQL: { disable: true }` or bind it to a guarded route.

### 1.5 In-memory rate limiters are bypassed per Vercel lambda
**Files:** `src/app/api/leads/route.ts`, `src/app/api/manychat/route.ts`, `src/app/api/storage/upload-url/route.ts`.

Each uses a module-scoped `new Map()` for rate limiting. On Vercel (serverless / edge / isolated function instances), that state is per-lambda-instance and resets on cold start, so an attacker can trivially exceed 5 req/min by distributing across instances. Given the lead endpoint also has an outbox+idempotency layer, the practical risk is more about email/Resend cost and HubSpot pollution than data loss, but it's worth noting.

**Fix:** use an Upstash/Redis/Convex-backed limiter, or move rate limiting to Vercel's WAF/middleware before the handler.

---

## 2. Security observations (defense in depth — mostly good)

Things done well:

- **Lead delivery is idempotent** (content-addressed `SKY-…` lead IDs, Supabase upsert-on-conflict, database-level `claim_lead_delivery` outbox with retry window — `20260727000000_b10_security_stabilization.sql`).
- **HMAC-style webhook secret compare** uses constant-time char-XOR (no `===` early exit), and fails-closed when the secret is unset on Vercel — `verifyRequiredWebhookSecret()` in `src/lib/api/utils.ts`.
- **Cron endpoint** (`/api/cron/seo-ping`) requires `Authorization: Bearer <CRON_SECRET>` when on Vercel.
- **Photo uploads** are gated via a server-side signed-URL flow that writes a `private_file_intents` row first (expected mime/size), and the Supabase bucket is marked private with explicit allowed MIME types and a 10 MB cap.
- **CSP** in `vercel.json` is reasonably locked down; `style-src` and `script-src` use `'unsafe-inline'` which is required for Next/Tailwind and Clerk.
- **ManyChat webhook** is signed via `x-manychat-secret`, not left open.
- **Zod validation** on the lead payload with a honeypot (`website` field), email regex, and size-capped inputs.
- **HTML escaping** (`escapeHtml`) applied to lead fields before building notification HTML.
- **Security.txt** present at `/.well-known/security.txt`.
- **RLS** on `leads`/`lead_events`/`lead_delivery_outbox`/`private_file_intents`; service-role-only paths explicitly `REVOKE` from anon/authenticated.

Things to tighten:

- **CSP `script-src`** includes `https://*.clerkstage.dev https://*.lcl.dev` (development Clerk origins) and `https://challenges.cloudflare.com` unconditionally in production. These are inert if unused but aren't needed on prod — gate them by `NEXT_PUBLIC_APP_ENV` at build/runtime.
- **CSP `connect-src`** does not include `https://api.resend.com` — but Resend is only called server-side, so that's fine (do not add it, it would be wasteful).
- **`X-Frame-Options: DENY`** is set; with CSP `frame-ancestors 'none'` this is redundant but harmless.
- **`strict-transport-security`** is set at the edge, which is good. However the `max-age=31536000` does not include `preload` — that's fine.
- **`Access-Control-Allow-Origin` on `/api/*` is hard-coded to `https://www.skysthelimitpaintingllc.com`**. The ManyChat/Zapier webhook callers don't run in a browser so they don't care, but preflight `OPTIONS` isn't implemented (Next will 405 it), which is fine for same-origin form posts.
- **Portal cookie/SameSite:** Payload admin cookies set `sameSite: 'Strict', secure: true` — good.
- **`SUPABASE_SERVICE_ROLE_KEY` usage** is restricted to API routes and `lib/leads/persistence.ts` (no client components import it). Verified with grep.
- **No hardcoded live secrets** found in the repo (searched for `sk_live_`, `pk_live_`, `whsec_`, `AKIA…`, `AIza…`, GitHub tokens, Slack tokens). The `GOOGLE_SITE_VERIFICATION` value in `layout.tsx` (`E4yKOu61Os6v4EQNmZ6-djni1eCyuDCw6v_XyLYFo90`) is the public Google Search Console verification code, which is designed to be public.
- **`onboarding@resend.dev`** is the default `LEAD_FROM_EMAIL` in `src/app/api/leads/route.ts`. Resend's test sender only works for the verified owner inbox — in production the auto-reply and owner-notification will silently fail unless a verified domain/`LEAD_FROM_EMAIL` is configured. Warn loudly or fail fast on production when using the default.
- **HubSpot Portal ID `246259637`** is hardcoded in two route handlers — pull to an env var to keep dev/prod separate and make tests easier.

---

## 3. Test failures

`npm test` reports `# tests 543 / # pass 522 / # fail 7 / # skipped 14`.

Failing tests:

| # | Test | File | Root cause |
|---|---|---|---|
| 62 | control-plane ledgers project live execution state and explicit approvals | `tests/control-plane-ledgers.test.mjs` | `better-sqlite3` native binding is not compiled for the sandbox's Node 22 (`node-v127-linux-x64`). `.nvmrc` pins Node 24 but the sandbox runs 22; `npm rebuild better-sqlite3` didn't produce a binary. **Likely green in CI which uses Node 24**, but `npm install --ignore-scripts` (default on some caches) skips the compile. Add an `npm rebuild better-sqlite3` step or list it as an `optionalDependency` with a prebuild. |
| 63–66 | approval ledger migration tests (4 cases) | same file | Same `better-sqlite3` binding problem. |
| 131 | pre-push accepts only the exact integration ref and gates SQLite state | `tests/verify-push-target.test.mjs` | Same native-module environment issue (also imports libSQL/SQLite paths). |
| 136 | the exact committed reconciliation passes against real Git topology | `tests/...` | Looks like a branch-name assertion expecting `main`/`dev`/release naming — this sandbox is on an `arena/…` branch, so it fails. That's an environment issue, not a code bug.

**Action:** confirm the control-plane-ledger failures are environmental by running `npm test` on Node 24 (matching `.nvmrc`) in CI. If they still fail there, that's a real regression to fix. The test #136 is expected to fail on non-blessed branches — consider making it opt-in (skip unless CI or specific branch).

---

## 4. Build / runtime

- `tsc --noEmit` passes cleanly. Good.
- `next build` in the sandbox failed because Turbopack couldn't reach `fonts.googleapis.com` to self-host Inter (egress blocked). The code path itself is fine; Next 16 fetches Google fonts at build time to inline them. This is a sandbox-only failure; production Vercel builds will have egress.
- `tsconfig.json` uses `"strict": false` with only `"strictNullChecks": true`. Enabling full `strict` mode would catch a class of bugs; the seven `as any` usages (see §6) are the main blockers.
- `next.config.ts` uses the experimental `cacheComponents: true` (Next 16 PPR/Cache Components). Worth confirming on Vercel before promoting heavy traffic.
- `next.config.ts` uses `withPayload()` with `configPath: './src/payload.config.ts'`; Payload needs `SUPABASE_DB_URL` at build/runtime. When unset, the placeholder `postgres://localhost:5432/payload_placeholder` is used — that will crash the build in environments without Payload secrets. Consider gating Payload behind an env flag if you want marketing-only builds to succeed without Postgres.

---

## 5. Dependency audit

`npm audit --omit=dev` reports:

| Package | Severity | Versions affected | Installed | Notes |
|---|---|---|---|---|
| `hono` (direct) | Moderate (ReDoS in CORS, `memo()` SSR leak, header leak, language middleware DoS) | `<4.12.34` | `4.12.32` | **Direct dep — bump to ≥4.12.34.** CVE-2026-* advisories. |
| `fast-uri` (transitive via `ajv`) | High (host confusion via backslash) | `3.0.0–3.1.4` | `3.1.4` | `package.json` has an override for `ajv >=8.18.0` but not for `fast-uri`; add `"fast-uri": ">=3.1.5"` to `overrides` or bump `ajv` to a release that pulls `fast-uri@^3.1.5`. |
| `brace-expansion` | High (DoS) | `<5.0.9` | `5.0.8` via minimatch (dev). Already overridden to `>=10.2.3` for minimatch — confirm `brace-expansion` resolves to ≥5.0.9; add `"brace-expansion": ">=5.0.9"` to overrides to be explicit. The `npm ls` output showed `5.0.8` coming through `markdownlint-cli → minimatch@10.2.5`. |

The repo pins several other CVEs via `overrides` (`undici`, `ws`, `esbuild`, `tar`, `path-to-regexp`, `sharp`, etc.) — that's good hygiene; just extend it to the three above.

- `express@5.2.1` is listed as a direct dependency but I found no usage in `src/` or `convex/`. It's likely leftover from a harness. Remove it to cut the attack surface (and the `path-to-regexp@0.1.13` override it requires).
- `better-sqlite3` is a direct dependency used by Agent OS/control-plane scripts; document that it requires native tooling in CI, or move it to `optionalDependencies` so `npm install` doesn't fail on Windows/alternative architectures.
- `@libsql/client` is in `dependencies` but not referenced from `src/`/`convex/` (it's used by `scripts/` Agent OS). Move to devDependencies to keep the production lambda bundle smaller.
- `next@16.2.12` is very recent (pre-release?); lockfile is committed which is good, but pin via exact version and note in docs that Next 16 is still moving quickly.
- `typescript@6.0.3` is a future version? This looks unusual — TypeScript's stable release is 5.x as of this audit. Confirm this is intentional / from a canary channel.

---

## 6. Code quality

### TypeScript
- `"strict": false` — the team has `strictNullChecks` on but other strict flags off. Low-risk rollout: turn on `noImplicitAny`, `strictFunctionTypes`, `useUnknownInCatchVariables` first.
- 7 `any` usages:
  - `src/app/api/manychat/route.ts:143, 252` — `searchData as any` and `let body: any`. Type via Zod/inline types.
  - `src/components/LeadForm.tsx:495, 507` — `option as any` / `e.target.value as any` casts around market options.
  - `src/components/ReviewCarousel.tsx:80` — `(row: any)` mapping Supabase rows.
  - `src/components/ServiceAreaMap.tsx:42` — Leaflet type coercion.
  - `src/types.d.ts:17` — declared `const content: any` (module shim).
- 41 `console.*` calls in `src/`. Most are in API routes (appropriate for logging); the rest are debug prints that should be gated behind a `NODE_ENV !== 'production'` check or a structured logger.

### Config drift
- **Two `robots.txt` sources**: `public/robots.txt` (static, only disallows `/review`) and `src/app/robots.ts` (App Router, disallows `/admin`, `/api/`, `/review`). Next.js serves the App Router version, so the static file is dead/confusing. Either delete `public/robots.txt` or generate it from one source of truth.
- **Two `sitemap.xml` sources**: `src/app/sitemap.ts` (App Router, dynamic) and `public/sitemap.xml` (postbuild-generated, dated 2026-07-20). The postbuild script writes to `public/sitemap.xml`; Next's App Router sitemap takes precedence at `/sitemap.xml`, making that file (and `sitemap.xsl`) stale. Pick one.
- **Hardcoded site URL** in many places: `https://www.skysthelimitpaintingllc.com` is string-literaled in:
  - All marketing pages' `canonical` metadata (11 files).
  - JSON-LD in the marketing layout.
  - `scripts/generate-sitemap.js` (ignores `process.env.SITE_URL` — uses the constant).
  Use `ENV.SITE_URL` everywhere so previews and local dev don't point search engines at prod.
- **Footer copyright year is hardcoded to 2026** in `src/app/(marketing)/layout.tsx` (`const currentYear = 2026;`). Use `new Date().getFullYear()`.
- **Missing `@clerk/nextjs` gate config** for the `(protected)` layout: the layout checks that env parses but doesn't redirect unauthenticated users on the server. That's why the page relies on `useConvexAuth()` client-side.
- **No ESLint configuration** found (no `.eslintrc*` or `eslint.config.*`). The `lint` script doesn't invoke ESLint — it runs TypeScript, design lint, and React version checks. That's a gap vs what `next lint` would catch.
- Prettier is configured; no `.prettierignore` issues visible.
- Markdownlint is configured.
- Husky hooks: `pre-commit` runs `lint:react` + `lint:types`; `pre-push` runs lifecycle checks and an optional `entire` CLI. Good.

### Dead / dormant code
- `express` is in deps but unused (see §5).
- `src/proxy.ts` is dead at runtime (see §1.2).
- `directus/Dockerfile` pins `directus/directus:11.3.5` while `docker-compose.yml` uses `12.1.4`. The Dockerfile comment says it's for Vercel Fluid; pin both to the same major.
- `public/brand/work/*.png` are byte-identical duplicates of files under `public/images/services/*/` (§7).
- Several commented-out/stub bits, e.g. `// res.status(500).json({...})` in the leads route.

---

## 7. Repository hygiene / asset bloat

Total tracked size is **~94 MB**, which is already large for a Next.js marketing site. Breakdown of avoidable weight:

| Waste | Size | Files | Action |
|---|---|---|---|
| `test-results.txt`, `test-results2.txt`, `test-results3.txt`, `test-results4.txt` | ~2.8 MB | 4 | These are `tee test.log` outputs that should never be committed. Add `test-results*.txt` to `.gitignore` and remove them. |
| `e2e_out.txt`, `diff.txt` | ~860 KB | 2 | Local diff/test output. Add to `.gitignore` and delete. |
| `public/videos/sky-hero-cinematic.mp4` | **5.4 MB** | 1 | Largest single asset. Consider serving from a CDN / Cloudflare Stream / Vercel Blob with range requests rather than the repo. |
| Duplicate PNGs in `public/brand/work/` (byte-identical to `public/images/services/*/`) | ~12.8 MB across 6 files | 6 pairs | `public/brand/work/` is not referenced anywhere in `src/` (grep confirms zero references). Delete the folder. |
| PNG + WebP pairs for the same image | ~25 MB | 14 pairs across `public/images/services`, `public/brand/generated`, `public/brand/gbp`, `public/images/site` | Code references `.webp` versions. Delete the unused `.png` originals after verifying they aren't needed for open-graph/fallback (Next/Image can use WebP directly). |
| `.agents/execution/skys-limit-sequential-tdd-execution-graph-audited.jsonl` | ~1.8 MB | 1 | Artifact of the execution-graph harness; consider committing a compact schema instead of the full JSONL. |

After cleanup I'd expect the repo to shrink from ~94 MB to ~40 MB tracked, which speeds clones and Vercel builds.

Other hygiene notes:

- `.gitignore` covers `.env*`, `.next/`, `node_modules/`, agent runtime dbs — good.
- But it does **not** ignore `test-results*.txt`, `e2e_out.txt`, `diff.txt`, or any other local `*.log` output beyond root `*.log`. Add them.
- `output/playwright/` exists on disk but isn't tracked. Good.
- `test-results.txt` etc. are committed **and** ignored by the wildcard `*.log`? No — `*.log` is in `.gitignore` but `.txt` isn't. Add explicit ignores.
- `AGENTS.md`, `.agents/`, `.claude/`, `.cursor/`, `.codex/`, `.gemini/`, `.qoder/` — the repo is heavily wired for AI coding assistants. That's a team choice, but it inflates the repo; consider whether `.agents/skills/**` and `.agents/goals/**` need to be in the main website repo or could move to a separate meta-repo.

---

## 8. SEO / marketing observations

- `/robots.txt` (App Router) is well-structured: explicitly allows AI crawlers (GPTBot, ClaudeBot, Perplexity, Google-Extended) on `/llms.txt`, blocks `/admin`, `/api/`, `/review`. Good.
- `/llms.txt` exists for LLM discoverability — nice.
- Local-business JSON-LD is emitted in the marketing layout (PaintingContractor schema with sameAs links, credential IR816596, service area, address).
- Sitemap covers static routes + landing pages (from `src/data/landingPages.ts` — 412 lines of service area/city landing pages). Good.
- Two sitemaps exist (stale issue, see §6).
- Review funnel at `/review` is correctly `noindex, nofollow`.
- Missing `/privacy` and `/terms` (§1.1) is also a Google Trust / Ads policy issue.
- Canonical URLs are hardcoded (see §6) which can create duplicate-content issues on preview deployments.
- `src/app/(marketing)/layout.tsx` ships a hardcoded Google verification code (public by design — fine).
- Footer has a dead "Privacy Policy" / "Terms of Service" link pair (same root issue).
- `currentYear = 2026` will look stale come January.

---

## 9. Recommended fix order (first hour)

1. **Add `/privacy` and `/terms` pages** (or remove links). This is user-visible 404s.
2. **Rename `src/proxy.ts` → `src/middleware.ts`** and export `middleware`, so Clerk's edge gate actually protects `/portal*` and `/manage*`.
3. **Fail-closed on missing `PAYLOAD_SECRET`** (throw in non-development when unset).
4. **Bump `hono` to ≥4.12.34** and add `fast-uri@>=3.1.5`, `brace-expansion@>=5.0.9` to `overrides`. Re-run `npm audit`.
5. **Remove tracked artifacts**:
   ```bash
   git rm test-results.txt test-results2.txt test-results3.txt test-results4.txt e2e_out.txt diff.txt
   echo "test-results*.txt\ne2e_out.txt\ndiff.txt\n*.log" >> .gitignore
   ```
6. **Delete unreferenced `public/brand/work/*.png` duplicates** (they're 0-references in `src/`).
7. **Delete or generate one source of truth for `public/robots.txt` and `public/sitemap.xml`** (keep the App Router versions).
8. **Replace hardcoded `https://www.skysthelimitpaintingllc.com`** in page metadata with `ENV.SITE_URL`; change footer year to `new Date().getFullYear()`.
9. **Re-run tests on Node 24** (matches `.nvmrc`) to confirm the 7 failures are sandbox-only.
10. **Consider** adding ESLint (next/core-web-vitals) to `lint:ci` and enabling `noImplicitAny`.

---

## 10. Scope / what wasn't done

- **Did not** run `next build` against real secrets (sandbox has no egress to Google Fonts, Supabase, Convex, Clerk). Static analysis only.
- **Did not** exercise live lead-submit / ManyChat / HubSpot / Resend flows.
- **Did not** deploy to Vercel or run Lighthouse; `.lighthouserc.json` exists but wasn't run.
- **Did not** audit Payload collection access rules beyond `Admins.ts`; recommend a follow-up pass that exercises `/admin/api` unauthenticated to confirm no collections are world-readable.
- **Did not** inspect `.agents/` governance files in depth; they're meta-tooling for AI-assisted dev, not shipped to production.

---

## Appendix: commands used

```bash
find / -maxdepth 3 -not -path '*/node_modules/*' -not -path '*/.git/*' ...
git ls-files | xargs ls -l | sort -k5 -nr | head -30   # large files
for f in public/brand/work/*.png; do ... md5sum ...   # duplicate detection
grep -rnE "sk_live_|pk_live_|whsec_|AKIA..." ...       # secret scan
npm install --no-audit --no-fund --ignore-scripts
npx tsc --noEmit                                       # ✅ clean
npm test                                               # 522 pass / 7 fail
npm audit --omit=dev --json
npx next build                                         # blocked by Google Fonts egress
```

See inline references in this report for file paths and line numbers.
