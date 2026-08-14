# Deployment Policy

Single source of truth for the production delivery acceptance gate, pipeline topology, and recovery route.

---

## Delivery Acceptance Gate

**Ownership Model:** GitHub validates source code and security. Vercel owns every Preview and Production Deployment through the repository's native Git integration.

**Pipeline Topology:**

| Workflow | Trigger | Responsibility |
|---|---|---|
| `ci.yml` | Pull requests and pushes for `main` and `staging` | Workflow contract, Git standards, lockfile install, TypeScript checks, and 318 tests |
| `security.yml` | Pull requests, pushes, weekly schedule, manual dispatch | CodeQL SAST, Dependency Review, and production dependency audit |
| `deployment-verification.yml` | Vercel deployment events, daily schedule, manual dispatch | Smoke-test the exact Vercel deployment URL or the production customer domain |

**Blocking behavior:**

- Merging to `main` requires all checks to pass (`CI / Repository Quality`, `Security / CodeQL`, `Security / Dependency Review`, `Security / Production Dependency Audit`, and Vercel Preview Deployment).
- Vercel automatically deploys `main` to production upon clean merge.
- `deployment-verification.yml` executes route smoke assertions against customer routes on the live deployment.

---

## Recovery Route

**Owner:** Repository maintainer (Johnny Cage)

**Primary recovery:** Vercel production rollback

```bash
npx vercel rollback --yes
```

This promotes the previous production deployment. Available for 90 days after any deployment.

**Alternative recovery:** Promote a known-good deployment by URL

```bash
npx vercel promote <deployment-url>
```

**Escalation:**

- If rollback fails, restore from the Vercel dashboard (Deployments -> Inspect -> Promote).
- For database migrations: `supabase db reset` (local) or Supabase dashboard backup (production).
- Never force-push to `main`; revert via `git revert <sha>` and let Vercel deploy the clean commit.

**Recovery SLA:** Initiate rollback within 15 minutes of detecting a production regression.

---

## Verification

- Acceptance gate blocks or records a decision before production deployment: **`ci.yml` & `security.yml` quality gates + Vercel Git deployment**
- Post-deployment route verification: **`deployment-verification.yml` live smoke tests**
- Named recovery route with owner: **`npx vercel rollback --yes` owned by repository maintainer**
