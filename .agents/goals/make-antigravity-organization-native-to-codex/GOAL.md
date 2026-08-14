---
type: goal
slug: make-antigravity-organization-native-to-codex
title: "Make Antigravity organization native to Codex"
status: active
phase: implement
created: 2026-08-14T23:25:44.696Z
---

# GOAL: Make Antigravity organization native to Codex

## Success criteria (edit these — must be verifiable)

- [ ] `npm run lint` passes
- [ ] `npm test` passes, including Codex adapter and hook regression tests
- [ ] `npm run agents:certify` passes all 16 existing certification gates with Codex-native assertions included
- [ ] `npm run host:compile` deterministically produces exactly A0-A10, V0-V10, and S1-S8 under `.codex/agents/`
- [ ] Every generated Codex agent uses the current `developer_instructions` contract; verifiers, specialists, and A1/A6/A10 are read-only
- [ ] Codex hooks preserve Entire checkpointing and enforce Git, Graphify, circuit, production, and communication boundaries for Codex payloads
- [ ] Codex guidance documents clean-context verification, exact-SHA evidence, native skill loading, and root-orchestrator routing
- [ ] Canonical agent definitions contain no Supabase routing or machine-specific absolute paths
- [ ] No unrelated files changed

## Loop

1. **Research** → `research.md` — graph:query, 1–3 files, risks
2. **Plan** → `plan.md` — steps with verify checks
3. **Implement** → code; re-run `npm run goal:verify` until green
4. **Done** → `npm run goal -- done` only after verify

## Commands

```bash
npm run goal -- phase research
npm run goal -- phase plan
npm run goal -- phase implement
npm run goal:verify
npm run goal -- done
```
