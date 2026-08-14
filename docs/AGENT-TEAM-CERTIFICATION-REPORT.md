# Antigravity and Codex agent-team certification report

Date: 2026-08-14

Branch: `feat/codex-antigravity-org`

Base SHA: `869f03dbcedd4a45cab293934ac1d8df26101fdb`

Candidate SHA: resolve with `git rev-parse HEAD` after the reviewed local commit; CI and preview evidence must match that exact value.

## Repository evidence

| Gate | Result | Evidence |
|---|---|---|
| Native organization discovery | PASS | Exactly 11 A-agents, 11 V-agents, and 8 S-agents under `.codex/agents/`; stale legacy profiles removed. |
| Codex schema | PASS | Every profile declares `name`, `description`, and `developer_instructions`; obsolete `instructions` rejected by regression tests. |
| Read-only isolation | PASS | A1, A6, A10, V0–V10, and S1–S8 declare `sandbox_mode = "read-only"`. |
| Verifier blindness | PASS | V-profiles reject parent conversation, accept only the evidence packet, and constrain verdicts to PASS/FAIL/UNCERTAIN. |
| Communication ACL | PASS | Deterministic guard denies A4 → A5 and permits A4 → A0; specialists remain parent-bound. |
| Graphify-first | PASS | Antigravity and Codex fixtures deny broad source discovery while allowing direct reads of known configuration files. |
| Git and production boundaries | PASS | Dangerous Git and production fixtures are denied; existing Husky and Entire hooks remain installed. |
| Antigravity hook protocol | PASS | Shared guards return official JSON `decision` responses for Antigravity and exit code 2 for Codex. |
| Portable host wiring | PASS | No machine-specific path in canonical MCP/Codex configuration; unsupported aggregate sidecars retired; user-global Supabase MCP explicitly disabled at the project layer. |
| Circuit state | PASS | Tracked default state and JSON Schema cover A0–A10; ignored runtime state overrides the default when present. |
| Host compilation | PASS | Two consecutive compiler runs produced identical adapter digest `CA29B81FFCD679EF19D4C9D2E4A650FAAB59938295567C8E8681EEEB6B5854DD`. |
| Agent certification | PASS | `npm run agents:certify`: 16 passed, 0 failed. |
| Repository tests | PASS | `npm test`: 318 passed, 0 failed across 22 suites. |
| Static verification | PASS | `npm run lint`: Git standards, React version parity, and TypeScript passed. |
| Goal verification | PASS | `npm run goal:verify` completed at `2026-08-14T23:54:36.726Z` with lint and test green. |

## Official contracts used

- [OpenAI Codex custom agents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [OpenAI Codex project hooks](https://learn.chatgpt.com/docs/hooks)
- [OpenAI Codex repository skills](https://learn.chatgpt.com/docs/build-skills)
- [Google Antigravity hooks](https://www.antigravity.google/docs/hooks)
- [Google Antigravity sidecars](https://antigravity.google/docs/sidecars)
- [Google Antigravity MCP configuration](https://antigravity.google/docs/mcp)

## Activation and external boundaries

Repository certification proves definitions, deterministic policy behavior, adapter parity, and existing application regressions. Two host-controlled steps cannot be granted by source code:

1. Review and trust the changed project hooks in Codex with `/hooks`, then restart the project session so the new custom-agent profiles are discovered.
2. Reload Antigravity customizations/MCPs from the isolated worktree and confirm the UI reports connected Graphify and DevHealer servers.

No branch was pushed, Draft PR opened, GitHub setting changed, Vercel deployment created, or Convex production data touched. Those remain human-governed external actions.
