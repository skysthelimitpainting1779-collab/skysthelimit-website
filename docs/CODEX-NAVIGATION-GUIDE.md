# Codex navigation and verification guide

Codex uses the same canonical engineering organization as Antigravity. The authoritative definitions remain under `.agents/`; `npm run host:compile` produces Codex-native profiles without creating a second orchestration system.

## Native surfaces

| Concern | Canonical source | Codex runtime |
|---|---|---|
| Universal policy | `AGENTS.md`, `.agents/KERNEL.md` | instruction chain |
| Standing agents | `.agents/specialists.json`, `.agents/manifests/agents/` | `.codex/agents/A0.toml`–`A10.toml` |
| Verifiers | `.agents/manifests/verifiers/`, `.agents/agents/v*.md` | `.codex/agents/V0.toml`–`V10.toml` |
| Specialists | `.agents/specialists.json` | `.codex/agents/S1.toml`–`S8.toml` |
| Skills | `.agents/skills/` | loaded natively from the repository |
| Hooks | `scripts/hooks/` | `.codex/hooks.json` |
| Runtime limits | canonical manifests and kernel | `.codex/config.toml` |

Generated files under `.codex/agents/` are adapters. Change canonical `.agents/` definitions, run `npm run host:compile`, and verify that a second compiler run is idempotent.

## Ownership and routing

The primary Codex thread is A0. It selects one primary standing agent for a coherent vertical slice and keeps coordination hub-and-spoke. A worker reports cross-domain dependencies to A0; it does not open a worker-to-worker implementation channel.

A specialist is optional, read-only, bound to one parent, and answers one difficult diagnostic question. A verifier is a separate read-only thread with clean context. Use `fork_turns = "none"` when dispatching a V-profile; the verifier must not see the implementer's conversational history.

## Graphify navigation

Start code discovery with:

```bash
npm run graph:query -- "<ownership, dependency, caller, or blast-radius question>"
```

Read the exact nodes and files Graphify surfaces. If the graph cannot answer after targeted reformulation and neighbor traversal, record the exhaustion in `.learnings/GRAPHIFY_EXHAUSTION.json`, perform one narrow fallback search, and preserve that evidence in the work packet.

## Candidate and verifier packet

Before independent verification, freeze and record:

- task contract and acceptance criteria;
- base commit SHA and candidate commit SHA;
- exact diff between those SHAs;
- Graphify blast-radius result;
- relevant Context7 source ID and contract, when an external API is involved;
- deterministic test, CI, and preview evidence tied to the candidate SHA.

The verifier returns `PASS`, `FAIL`, or `UNCERTAIN`. Only `PASS` allows A0 to continue toward the human release gate. A green check or preview for any older SHA is `NOT VERIFIED`.

## Hook trust and recovery

Codex project hooks are defined in `.codex/hooks.json` and execute relative to the active checkout or worktree. Review and trust them with `/hooks` after a fresh clone, IDE restart, or hook hash change. The hooks preserve Entire checkpointing and enforce dangerous Git, Graphify-first, production, circuit, and communication policies where Codex exposes the required identity fields.

Hooks cannot manufacture evidence the host does not provide. Exact test output and candidate-SHA proof must come from explicit commands and CI records, not telemetry inference.
