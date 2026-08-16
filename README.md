# skysthelimit — Sky's the Limit Painting LLC Website

**Slug:** `skysthelimit` · **npm:** `skysthelimit-website` · **Tasks:** [Linear](https://linear.app/skysthelimit)

**Live site:** [https://www.skysthelimitpaintingllc.com](https://www.skysthelimitpaintingllc.com)

Production website for **Sky's the Limit Painting LLC** — an owner-operated, fully insured Minnesota Specialty Contractor (Painting, **MN ID: IR816596**) based in Inver Grove Heights and serving the Twin Cities metro.

The site drives residential, commercial, and public-sector leads with estimate intake, local SEO, and AI-crawlable structure. Product work (homebase, portal, CMS, procurement) is managed in **Linear**, not GitHub Issues.

---

## Links

| | |
|---|---|
| **Website** | [www.skysthelimitpaintingllc.com](https://www.skysthelimitpaintingllc.com) |
| **Linear** | [skysthelimit workspace](https://linear.app/skysthelimit) |
| **Phone** | [651-410-4196](tel:+16514104196) (call / text) |
| **Email** | [skysthelimitpainting1779@gmail.com](mailto:skysthelimitpainting1779@gmail.com) |
| **AI crawl map** | [/llms.txt](https://www.skysthelimitpaintingllc.com/llms.txt) |
| **GitHub** | [skysthelimitpainting1779-collab/skys-the-limit-painting-llc-website](https://github.com/skysthelimitpainting1779-collab/skys-the-limit-painting-llc-website) (target rename: `skysthelimit-website`) |
| **Naming SSOT** | [`docs/NAMING.md`](./docs/NAMING.md) |
| **Agent guidance** | Kernel [`.agents/AGENTS.md`](./.agents/AGENTS.md) |
| **Design SSOT** | [`DESIGN.md`](./DESIGN.md) |
| **Templates** | [`docs/templates/`](./docs/templates/) |

---

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS 4** · shadcn/ui · Motion
- **Supabase** (Postgres / Auth / Storage)
- **Resend** (transactional email)
- **Vercel** (hosting, Analytics, Speed Insights)
- **Remotion** (brand video loops)
- **Agent guidance** (`.agents/` kernel, skills, and host-native adapters)
- **Linear** — tasks / milestones (`skysthelimit · Platform` · `Reliability`)

**Node:** `24.x` (see `.nvmrc`)

```bash
npm run ci:contract                    # validate CI workflow commands and local references
npm run learn:prevent:test             # self-test active prevention rules
npm run smoke:site -- --base-url http://localhost:3000
```

---

## Quick start

```bash
npm ci
cp .env.example .env.local   # fill secrets as needed
npm run dev                  # http://localhost:3000
```

### Verify (matches CI)

```bash
npm run ci:contract
npm run lint:ci                              # React-version verification · tsc --noEmit
npm test
npm run build
# or:
npm run ci
```

### Common scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build + sitemap |
| `npm run lint` | Git guard + react pins + TypeScript |
| `npm run lint:ci` | Verify React versions and run `tsc --noEmit` |
| `npm test` | Test suite |
| `npm run ci:contract` | Validate CI workflow commands and local references |
| `npm run smoke:site -- --base-url <url>` | Smoke-test a local or deployed site |
| `npm run learn:prevent:test` | Self-test active prevention rules |
| `npm run learn:prevent:rebuild` | Rebuild active prevention context |

---

## Routes

| Path | Purpose |
|------|---------|
| `/` | Homepage |
| `/residential` · `/commercial` · `/public-sector` | Market lanes |
| `/painting-services/[slug]` | Service SEO landings |
| `/service-area` · `/service-areas/[slug]` | Coverage + city pages |
| `/estimate` | Interactive estimate / lead path |
| `/projects` | Portfolio |
| `/about` · `/capabilities` · `/contact` | Company & leads |
| `/refer` · `/review` | Referral & review funnel |
| `/admin` | Internal console |
| `/api/leads` · `/api/*` | API routes |

---

## Compliance & claims

Only verified facts in marketing copy:

- **Contractor ID:** IR816596 (MN Specialty Contractor — Painting) near contractor references
- **Insurance:** Fully insured (GL + commercial auto/tools); COI for qualified commercial/public work
- **Workers' comp:** Owner-operator exempt under MN Statute 176.041 (zero payroll)
- **No unsupported claims:** no fake reviews, no “licensed/bonded/award-winning” without evidence
- **Owner-operated** positioning; journeyworker painting background only

---

## CI / CD & PR automation

| Workflow | What it does |
|----------|----------------|
| **CI/CD Pipeline** | Git standards → lint · knip · test · build |
| **PR Automation** | Branch normalize · PR title · labels · Vercel verify · auto review · sticky dashboard |
| **Security Scan** | npm audit · dependency review |
| **CodeQL** | JS/TS analysis |
| **Release** | Tag `v*` → production deploy (Vercel token) |

**Branch prefixes:** `feat/` `fix/` `chore/` `docs/` `infra/` `agent/` `devin/` `dependabot/`  

**Commits:** Conventional Commits — `type(scope): subject`

**Agent work:** see [`.agents/AGENTS.md`](.agents/AGENTS.md)

---

## Project layout

```text
src/app/          Next.js App Router pages & API
src/components/   UI & conversion components
src/views/        Page bodies
src/lib/          SEO, Supabase, env, analytics
scripts/          CI, automation, hooks, and maintenance tools
.agents/          Agent guidance, skills, and host-native configuration
.github/          Workflows, CODEOWNERS, templates
public/           Static assets, llms.txt, sitemap
supabase/         Migrations
tests/            Node test suite
```

---

## Environment

See [`.env.example`](.env.example). `src/lib/env.ts` accepts standard / `NEXT_PUBLIC_` / Vercel integration prefixes. The site falls back safely when optional services (e.g. Supabase) are unset.

Required for full production: Supabase, Resend, site URL, analytics IDs as needed.

---

## License / ownership

Private business website for **Sky's the Limit Painting LLC**. Not open-source licensed for third-party reuse of brand assets or marketing content.
