# Codex and Antigravity agent-team migration

Date: 2026-08-14

Base revision: `869f03dbcedd4a45cab293934ac1d8df26101fdb`

Scope: engineering-agent organization only; existing GitHub, Eve, CI, Vercel, Convex, WorkOS, Graphify, Context7, Husky, Entire, skill, and evaluation primitives remain authoritative.

## Current-state inventory and action

| Artifact or subsystem | Finding | Classification | Implemented action |
|---|---|---|---|
| `AGENTS.md` and `.agents/KERNEL.md` | Portable kernel and universal invariants already exist | PRESERVE + UPGRADE | Preserve authority; add the Codex A0 dispatch, clean-context verifier, hook-trust, and exact-SHA operating contract. |
| `.agents/specialists.json` | Canonical A0–A10 and S1–S8 registry already exists | PRESERVE | Continue using it as compiler input; do not create a second registry. |
| `.agents/manifests/agents/` | Full permission, tool, plugin, MCP, loop, and ACL contracts exist | UPGRADE | Remove obsolete Supabase MCP routing; keep Convex and WorkOS boundaries. |
| `.agents/manifests/verifiers/` and `.agents/agents/v*.md` | V0–V10 contracts exist and are read-only in Antigravity | PRESERVE + COMPILE | Compile them into native Codex V-profiles with clean-context rules and read-only sandboxes. |
| `.agents/manifests/specialists/` | Bounded specialist manifests already exist | CONSOLIDATE | Compile only the S1–S8 registry into Codex; no dynamic specialist swarm. |
| `.codex/agents/A*.toml` | Generated with obsolete `instructions` key and mostly empty bodies | REPLACE | Emit current `developer_instructions` with the complete domain contract. |
| Legacy Codex profiles (`api`, `agent-os`, `ci-devops`, and similar) | Parallel, unbounded role taxonomy with backend drift | REMOVE | Compiler deletes profiles not present in canonical A/V/S IDs. |
| `.codex/agents/V*.toml` and `S*.toml` | Absent | UPGRADE (NEW ADAPTERS) | Generate 11 clean verifiers and 8 read-only parent-bound specialists. |
| `.codex/config.toml` | Hooks enabled; native multi-agent limits absent | UPGRADE | Enable bounded agents and set a 10-thread session ceiling. |
| `.codex/hooks.json` | Entire hooks only; Unix `sh` wrapper on Windows | PRESERVE + HARDEN | Preserve all Entire events through a portable Node bridge; add universal PreToolUse and telemetry hooks. |
| `scripts/hooks/*.mjs` | Read Antigravity field casing only | UPGRADE | Normalize Codex `tool_name` and `tool_input` while retaining Antigravity compatibility. |
| Communication enforcement | Declared in prompts but absent from Codex hooks | UPGRADE | Enforce A0 hub-and-spoke, parent-bound specialists, and verifier isolation when source/target identity is exposed. |
| Graphify enforcement | Antigravity grep guard works | PRESERVE + HARDEN | Add Codex Bash detection, known-file read allowance, and recorded-exhaustion fallback. |
| Circuit ledger | Runtime `.learnings/` path is ignored and may not exist on a fresh clone | CONSOLIDATE | Add a tracked, schema-backed closed-state default; use runtime state when present. |
| Entire and Husky hooks | Working checkpoint and Git governance | PRESERVE | No hook removal or bypass. |
| GitHub Actions, Eve/factory, Vercel | Existing delivery control plane | PRESERVE | No replacement scheduler, issue tracker, CI system, or deployment database. |
| Certification suite | 16 Antigravity gates already exist | PRESERVE + HARDEN | Extend existing discovery, Graphify, ACL, write-scope, and verifier gates with Codex-native assertions. |
| Skill system | `.agents/skills/` is canonical and natively recognized by Codex | PRESERVE | Keep progressive skill routing; compiler mirrors only for hosts that require mirrors. |

## Resulting Codex topology

```text
Primary Codex thread (A0)
├── A1–A10: one bounded standing-agent dispatch
│   ├── matching S-agent: optional, read-only, one question
│   └── matching V-agent: clean-context, read-only verdict
└── human release gate: merge and production authority
```

The primary thread assumes A0; it does not spawn a second A0. Cross-domain writer coordination returns to A0. A verifier receives an evidence packet without parent conversation and returns only `PASS`, `FAIL`, or `UNCERTAIN`.

## Scope boundary

This migration removes Supabase from agent governance and Codex routing. It deliberately does not rewrite application dependencies or production data paths as part of an agent-team task; any runtime backend migration requires its own bounded product work item, Graphify blast-radius analysis, and independent verification.
