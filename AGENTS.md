# AGENTS.md

Portable execution kernel for every coding agent working in this repository. Host-native
specialists compile from `.agents/specialists.json`; they may add context but may not
weaken this file.

**Product:** skysthelimit
**Tasks:** Linear `SKY-XX`
**Architecture:** [`.agents/CURRENT_DECISIONS.md`](.agents/CURRENT_DECISIONS.md)
**Branch policy:** [`config/platform-foundation.json`](config/platform-foundation.json)

---

## Required commands

```bash
npm install && npm run dev
node --test tests/branch-policy.test.mjs
npm run ci:contract
npm run lifecycle:verify
npm run telemetry:gate -- --input <absolute-request-path>
npm run lint:ci
npm test
npm run build
npm run graph:query -- "<task>"
npm run goal -- status
npm run goal:verify
npm run ship:eval
npm run host:compile
```

Use `npm ci`, not `npm install`, in CI and deployment environments.

---

## Branch and deployment authority

- `main` is production-only.
- `dev` is the non-production integration branch.
- Normal work starts from current `dev` on one short-lived branch and worktree.
- Normal work targets `dev`; only `dev` or an explicitly approved `hotfix/*` branch may
  target `main`.
- Never commit directly to `main` or `dev`.
- Never force-push a shared or protected branch.
- A permission to work is not permission to merge, promote, mutate production, or send
  customer-facing effects.
- Branch prefixes and allowed edges are defined in
  `config/platform-foundation.json` and enforced by `scripts/branch-policy.mjs`.

Canonical Vercel authority:

```text
Team:    team_bseTA2AuCO6A2fCOVY9ubrJo
Project: prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m
Name:    website
Status:  Vercel
```

Statuses from any other Vercel project are not release evidence. `main` owns Production.
`dev` and short-lived branches must deploy as Preview only.

---

## Entire CLI and checkpoints

**Installed globally:** Scoop package `entire/cli`
**Purpose:** session checkpoints linked to Git commits for supported coding agents
**Enabled agents:** Cursor, Gemini CLI, Codex

Git hooks are integrated through Husky:

```text
.husky/prepare-commit-msg
.husky/commit-msg
.husky/post-commit
.husky/post-rewrite
.husky/pre-push
```

Maintenance:

- Keep Entire CLI current through Scoop.
- Verify the hooks after dependency installation.
- Add supported hosts with `entire agent add <name>`.
- Keep `entire/*` branches excluded from Vercel deployment.
- Never remove Entire hooks or disable checkpointing without explicit approval.

---

## Host-native layout

| Host | Always-on | Specialists | Skills |
|---|---|---|---|
| All | `AGENTS.md` | `.agents/specialists.json` | `.agents/skills/` |
| Claude | `CLAUDE.md` -> `@AGENTS.md` | `.claude/agents/*.md` | `.claude/skills/` |
| Cursor | `.cursor/rules/00-agents-kernel.mdc` | `.cursor/agents/` | path rules |
| Codex | `AGENTS.md` | `.codex/agents/*.toml` | `.agents/skills/` |
| Antigravity | `GEMINI.md` and `.agents/rules/` | specialist rules | `.agents/skills/` |
| Copilot | `.github/copilot-instructions.md` | path rules | `.github/skills/` |

See [`.agents/HOST_NATIVE.md`](.agents/HOST_NATIVE.md). Keep host adapters thin and
generated. Run `node scripts/zero-theater.mjs` and `npm run host:compile` after changing
portable agent instructions or specialist routing.

---

## Operating principles

1. Think before coding: state assumptions and surface material tradeoffs.
2. Discover before editing: understand the live dependency path and existing patterns.
3. Use the smallest correct change: no speculative platform or abstraction work.
4. Test first: prove the intended missing behavior before implementation.
5. Preserve evidence: every claim of success must name the command and exact revision.
6. Stop safely: do not push through ambiguous effects, stale state, or repeated failure.

### Mandatory discovery and reuse

- Query Graphifyy before broad code navigation. Use repository `graph:*` commands when
  connector tools are unavailable. Fall back to literal search only when necessary.
- Query current official documentation through Context7 before changing a library,
  framework, provider, or API contract.
- Start with no more than three relevant source files unless the graph proves more are
  required.
- Reuse existing modules and source-owned shadcn components before creating new ones.
- Capture workflows that will repeat as repository skills under `.agents/skills/`.
- Do not bulk-load generated graph reports, wikis, telemetry dumps, or skill packs.

---

## Governed execution lifecycle

Before selecting or mutating work:

1. Run execution-graph preflight.
2. Read the current cursor and selected node.
3. Reconcile branch, exact HEAD, worktree cleanliness, and active leases.
4. Acquire one scoped writer lease.
5. Confirm the provider account, team, project, environment, and operation class.
6. Record the plan and acceptance contract before implementation.

For every non-trivial behavior change:

```text
goal
-> graph and source discovery
-> current provider documentation
-> focused failing test
-> verify intended red failure
-> smallest implementation
-> same focused test green
-> related regression checks
-> lint and type checks
-> independent review
-> exact-head canonical Preview
-> governed integration
```

- Use one task branch and worktree per active writer.
- The main checkout remains read-only.
- Maximum implementation attempts for the same root cause: two. Then stop and replan.
- Complete a checkpoint only from a clean committed revision with passing evidence.
- Before checkpoint completion, run
  `npm run telemetry:gate -- --input <absolute-request-path>` and persist the secret-free
  decision with `lifecycle_record_telemetry_decision`. Stop on any nonzero exit.
- Every governed commit after `5eb385d33976503cdac81e982ed74fbbc7f6839c`
  requires `Execution-Program`, `Execution-Node`, `Checkpoint-ID`, and
  `Evidence-SHA256` trailers.
- The audited execution graph remains authoritative for dependencies, gates, node IDs,
  stop conditions, and evidence. Historical branch names inside that retained graph are
  provenance, not current branch-routing instructions.
- See [`docs/DEVELOPMENT_LIFECYCLE.md`](docs/DEVELOPMENT_LIFECYCLE.md) and
  [`docs/BRANCHING_AND_RELEASES.md`](docs/BRANCHING_AND_RELEASES.md).

---

## Environment and effect boundaries

Development, Preview, and Production use matched but isolated provider bundles. See
[`docs/ENVIRONMENT_MATRIX.md`](docs/ENVIRONMENT_MATRIX.md).

Hard rules:

- Never copy Production secrets into Preview by default.
- Never expose deployment keys or server credentials to browser code.
- Preview uses non-production Convex and Clerk resources.
- Preview does not send unrestricted customer email or SMS.
- Preview does not use live Stripe credentials or real payment methods.
- Preview workflows must be test-mode, reversible, and incapable of production mutation.
- Verify webhook signatures from raw request bodies and deduplicate provider event IDs.
- Every external effect requires idempotency, bounded retries, timeout, cancellation, and
  a compensating or rollback action.
- Do not store tokens, cookies, private keys, raw PII, or low-entropy secret hashes in
  Git, logs, analytics, URLs, evidence, or model context.
- Production data, schemas, domains, communications, payments, provider resources,
  cutover, and decommissioning remain blocked until their named human approval gates.

Stop immediately when the provider identity, environment, effect class, or rollback path
is ambiguous.

---

## Application architecture boundaries

- Convex is the operational backend and business-state system of record.
- Clerk proves identity; Convex owns authorization through durable provider IDs and
  explicit resource grants.
- Staff access is invitation-only. Privileged staff require MFA.
- Supabase, Payload, and Directus remain migration sources and rollback dependencies.
- Do not create a parallel application database, authorization layer, or provider bridge.
- Do not replace Clerk with WorkOS without a separate approved ADR, migration plan,
  rollback plan, and test suite.
- Convex scheduling owns deterministic database-local jobs.
- Vercel Workflow is reserved for durable multi-step external effects after its workflow
  contract, budget, observability, cancellation, and rollback tests exist.
- Vercel Functions and Next.js route handlers own explicit HTTP boundaries.
- Customer, lead, proposal, agreement, project, and bid files are private by default.
- Public media requires an explicit publication classification.

Target stack and migration boundaries are authoritative in
[`.agents/CURRENT_DECISIONS.md`](.agents/CURRENT_DECISIONS.md).

---

## Vercel services and integrations

Use the canonical `website` project only. Existing GitHub, Convex, Clerk, Analytics, Speed
Insights, Functions, and deployment integrations remain the baseline.

Do not provision a paid or stateful integration merely because it is available. Blob,
Workflow, AI Gateway, Queues, Stripe live mode, and new data services activate only when:

1. a shipped feature requires the service;
2. ownership and environment scope are explicit;
3. cost and usage limits exist;
4. security and data-classification requirements are tested;
5. rollback and provider-exit procedures exist;
6. exact-head Preview verification passes.

See [`docs/VERCEL_INTEGRATIONS.md`](docs/VERCEL_INTEGRATIONS.md).

---

## Delivery acceptance

The minimum delivery gate is:

```bash
node --test tests/branch-policy.test.mjs
npm run ci:contract
npm run lifecycle:verify
npm run lint:ci
npm test
npm run build
```

For integration, the exact reviewed head also requires:

- Repository Quality passing;
- Security passing;
- independent review with no blocking findings;
- repository-owned `Vercel` verification of the canonical Preview in READY state;
- customer-route smoke validation when runtime behavior changes;
- clean worktree and immutable evidence receipt.

No production delivery is accepted without a verified release PR from `dev` to `main`,
an approved rollback target, and explicit production authorization.

---

## Recovery

- Never repair `main` or `dev` by rewriting history.
- Revert the offending change or promote the last known-good canonical Vercel deployment.
- Pause outbound messages, payments, workflows, and scheduled effects before recovery.
- Convex schema or data repair uses a tested compensating migration or verified restore
  procedure; never use a destructive local reset as production guidance.
- Record the deployed commit, Vercel deployment ID, environment, verification result,
  rollback target, and operator for every release.
- Follow [`docs/runbooks/platform-rollback.md`](docs/runbooks/platform-rollback.md).

---

## Project and UI standards

- Next.js App Router and TypeScript under `src/`.
- Measured Craft geometry with the established orange and charcoal brand.
- No emojis in product source.
- Public claims must be verifiable.
- Meet WCAG 2.2 AA, keyboard, focus, reduced-motion, and responsive requirements.
- Route every non-trivial interface change through
  `.agents/skills/award-winning-ui-orchestration/SKILL.md`.
- Use the official shadcn MCP for discovery and source-owned customization.
- Pair UI execution with an independent verifier.
- Preserve Convex and Clerk provider/query ownership boundaries.

---

## Context discipline

| Always load | Load on demand | Never bulk-load |
|---|---|---|
| `AGENTS.md` | one relevant skill | generated graph wikis |
| current task contract | relevant specialist | full telemetry dumps |
| exact graph node | up to three initial files | entire skill packs |
| current decision record | current official docs | unrelated repository history |

Hard denials are fail-closed: no soft skips, no unreviewed production effects, no
`next/dynamic` with `ssr:false`, no generated runtime state in Git, no weakening tests to
obtain green, and no recreation of deliberately purged platform bloat.

---

## Evals and improvement

```bash
npm run ship:eval
npm run ship:improve
```
