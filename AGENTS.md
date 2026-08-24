# AGENTS.md

Portable kernel for **any** coding agent. Host-native specialists compile from `.agents/specialists.json`.

**Product:** skysthelimit · **Tasks:** Linear `SKY-XX` · **Stack:** [`.agents/STACK.md`](.agents/STACK.md)

---

## Commands

```bash
npm install && npm run dev
npm run lint
npm test
npm run build
npm run graph:query -- "<task>"
npm run goal -- status
npm run goal:verify
npm run ship:eval
npm run host:compile          # regenerate Claude/Cursor/Codex/Copilot/Gemini adapters
```

---

## Entire CLI

**Installed globally:** via Scoop (`scoop install entire/cli`) - v0.8.42  
**Purpose:** Session checkpointing linked to Git commits for all coding agents

**Enabled agents:** Cursor, Gemini CLI, Codex  
**Git hooks:** Integrated via Husky (`.husky/prepare-commit-msg`, `commit-msg`, `post-commit`, `post-rewrite`, `pre-push`)

**Maintenance:**
- Keep Entire CLI updated: `scoop update entire/cli`
- Verify hooks after npm install: Husky may overwrite; check `.husky/*` files contain Entire calls
- Add new agents: `entire agent add <name>` (claude-code, copilot-cli, cursor, gemini, codex, etc.)
- Disable Vercel deployments for `entire/**` branches: `entire configure`

**Hard denial:** Never remove Entire hooks or disable checkpointing without explicit approval.

---

## Host layout (native)

| Host | Always-on | Specialists | Skills |
|------|-----------|-------------|--------|
| **All** | this file | `.agents/specialists.json` | `.agents/skills/` |
| **Claude** | `CLAUDE.md` → `@AGENTS.md` | `.claude/agents/*.md` | `.claude/skills/` |
| **Cursor** | `.cursor/rules/00-agents-kernel.mdc` | `.cursor/agents/` + `specialist-*.mdc` | path via rules |
| **Codex** | `AGENTS.md` | `.codex/agents/*.toml` | `.agents/skills/` |
| **Antigravity** | `GEMINI.md` + `.agents/rules/` | `.agents/agents/*.md` + `.agents/manifests/` | `.agents/skills/` |
| **Copilot** | `.github/copilot-instructions.md` | path rules | `.github/skills/` |

Map: [`.agents/HOST_NATIVE.md`](.agents/HOST_NATIVE.md)  
**Zero theater:** only host-native paths + hard hooks. No domains/queues/hub_db/ontology novels.  
`npm run agents:zero-theater` · `npm run host:compile`

---

## Behavior (Karpathy)

1. **Think before coding** — state assumptions; ask if unclear; surface tradeoffs.
2. **Simplicity first** — minimum code; no speculative abstractions.
3. **Surgical changes** — only what the task requires.
4. **Goal-driven** — verifiable success; loop until `npm run goal:verify` passes.

## Mandatory discovery and reuse

- **Official Graphifyy MCP first:** Before navigating or searching code, query the official local Graphifyy MCP against this worktree so branch and uncommitted changes are represented. Use the hosted OAuth Graphify MCP only as fallback or corroboration because it indexes promoted/default-branch state. Fall back to `rg` only for literals/config/non-code or when both Graphify sources are insufficient. Keep the local server on the newest `graphifyy` package via `uvx --refresh --from graphifyy graphify-mcp --graph graphify-out/graph.json`.
- **Context7 first:** Before implementing or changing behavior from an external library, framework, provider, or API, query its current official documentation through Context7. Record the selected library ID and the contract that affects the change.
- **Skill before repetition:** Before performing a workflow a second time—or when the plan already shows it will recur—create or update a repository skill under `.agents/skills/` and route subsequent executions through it. Use `repeatable-workflow-capture`; validate the skill, run `npm run skills:validate`, and compile host adapters.

---

## Ship loop (RPI)

Non-trivial work:

```bash
npm run goal -- start "short title"
npm run goal -- phase research   # graph:query + research.md
npm run goal -- phase plan
npm run goal -- phase implement
npm run goal:verify
npm run goal -- done
```

Skill: `ship-loop` (`.agents/skills/ship-loop/`).

---

## Delivery acceptance & recovery

Full policy: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

**Production delivery model:** Source quality is enforced by `.github/workflows/ci.yml` and `.github/workflows/security.yml`. Production deployment is executed through Vercel's native Git integration upon merge to `main`. Customer routes are smoke-tested post-deployment by `.github/workflows/deployment-verification.yml`.

**Local pre-delivery gate:** `npm run goal:verify` runs lint + test (optionally
`--build`) and writes to `.agents/goals/_eval/last.json`.

**CI boundary:** `.github/workflows/ci.yml` runs git-standards,
lint, typecheck, and tests on PRs to `main` and branch pushes.

**Recovery route (owner: Johnny Cage, repo maintainer):**

```bash
npx vercel rollback --yes          # rollback to previous production deployment
npx vercel promote <deployment-url> # promote a known-good deployment
```

- Recovery SLA: initiate rollback within 15 minutes of detecting regression.
- Vercel rollback available for 90 days post-deployment.
- For database migrations: `supabase db reset` (local) or Supabase dashboard
  backup (production).
- Never force-push to `main`; revert via `git revert <sha>` and re-deploy.

---

## Project style

- Next.js App Router · TypeScript under `src/`
- Industrial UI: **radius 0** · `#FF5A00` on charcoal · **no emojis** in product source
- Root cause only · public claims verifiable

---

## Context

| Always | On demand | Never bulk-load |
|--------|-----------|-----------------|
| This file | One skill `SKILL.md` | `graphify-out/wiki/**`, `GRAPH_REPORT.md` |
| | Specialist agent for the path | Full skill packs, hub dumps |

Hard denials (hooks): emoji in `src/`, wiki dumps, soft-skips, next/dynamic+ssr:false, recreate purged bloat. Soft env cannot disable denials.

---

## Evals / improve

```bash
npm run ship:eval
npm run ship:improve    # purge + hard purge + prevent + health + eval
```
