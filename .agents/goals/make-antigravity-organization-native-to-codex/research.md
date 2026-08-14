# Research — Make Antigravity organization native to Codex

## Graph query

```bash
npm run graph:query -- "Codex Antigravity custom agents host compiler hooks certification"
npm run graph:query -- "compile-host-native .codex/agents TOML custom agent"
```

## Files / flows

- `scripts/compile-host-native.mjs` is the canonical adapter compiler. Its Codex emitter currently writes obsolete `instructions`, emits only A-agents, and retains stale hand-authored Codex agents.
- `.agents/specialists.json`, `.agents/manifests/**`, and `.agents/agents/v*.md` are the canonical standing-agent, specialist, and verifier sources.
- `.codex/config.toml`, `.codex/hooks.json`, and `.codex/agents/*.toml` are Codex-native runtime surfaces.
- `scripts/hooks/*.mjs` enforce universal policy but currently parse Antigravity field names rather than Codex `tool_name` / `tool_input` payloads.
- `.agents/certification/run-certification.mjs` runs the protected 16-gate suite; existing gates validate Antigravity surfaces but not Codex parity.
- Official Codex contracts verified from OpenAI documentation: project custom agents use `.codex/agents/*.toml` with `name`, `description`, and `developer_instructions`; read-only roles use `sandbox_mode = "read-only"`; project hooks use `.codex/hooks.json`; repository skills load natively from `.agents/skills/`.
- Local Codex CLI 0.145.0 contract check: `mcp_servers.<name>.enabled = false` disables an inherited user-global MCP at the project layer without changing the user's global configuration.
- Official Antigravity hooks contract: `.agents/hooks.json`, regex tool matchers, camelCase metadata plus `toolCall`, JSON `decision` for PreToolUse, and `{}` for PostToolUse ([Google Antigravity hooks](https://www.antigravity.google/docs/hooks)).
- Official Antigravity sidecar contract: discovery uses one `sidecar.json` per global or plugin sidecar and user-level enablement; a workspace aggregate `.agents/sidecars.json` is not a supported discovery surface ([Google Antigravity sidecars](https://antigravity.google/docs/sidecars)).
- Official Antigravity MCP contract: workspace `.agents/mcp_config.json` supports stdio `command`, `args`, and `cwd`, enabling portable workspace-relative configuration ([Google Antigravity MCP](https://antigravity.google/docs/mcp)).

## Risks

- Removing legacy Codex agents must happen only as deterministic compiler cleanup; canonical Antigravity definitions remain untouched except for obsolete backend routing.
- Hook payloads vary by host. Normalization must preserve existing Antigravity inputs while adding Codex inputs.
- Codex project hooks require user trust after their hash changes; certification can validate wiring and behavior but cannot silently grant that trust.
- Agent models must inherit the active Codex model because Antigravity labels such as `pro` and `flash` are not valid Codex model IDs.
- Existing dirty work belongs to the user; all implementation is isolated in the dedicated worktree and branch.
