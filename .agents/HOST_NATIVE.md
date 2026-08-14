# Host-native layout

| Host | Always-on | Specialists | Skills |
|------|-----------|-------------|--------|
| **All** | `AGENTS.md` | `.agents/specialists.json` | `.agents/skills/` |
| **Claude** | `CLAUDE.md` → @AGENTS.md | `.claude/agents/*.md` | `.claude/skills/` |
| **Cursor** | `.cursor/rules/00-agents-kernel.mdc` | `.cursor/agents/` + `specialist-*.mdc` | via AGENTS + skills path |
| **Codex** | `AGENTS.md` + `.codex/config.toml` | `.codex/agents/{A0-A10,V0-V10,S1-S8}.toml` | `.agents/skills/` |
| **Antigravity** | `GEMINI.md` + `.agents/rules/` | rules/specialists.md | `.agents/skills/` |
| **Copilot** | `.github/copilot-instructions.md` | (path rules) | `.github/skills/` |
| **Gemini CLI** | `context.fileName`: AGENTS + GEMINI | same | `.agents/skills/` |

Compile: `npm run host:compile`  
Clean custom domains: `npm run host:compile -- --clean-domains`

Codex runtime: `.codex/config.toml` enables bounded subagents and `.codex/hooks.json` wires portable policy hooks while preserving Entire checkpointing. The primary Codex thread is A0; V-agents must be dispatched with clean context and all V/S profiles are read-only.
