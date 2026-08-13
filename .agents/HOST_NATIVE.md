# Host-native layout

| Host | Always-on | Specialists | Skills |
|------|-----------|-------------|--------|
| **All** | `AGENTS.md` | `.agents/specialists.json` | `.agents/skills/` |
| **Claude** | `CLAUDE.md` → @AGENTS.md | `.claude/agents/*.md` | `.claude/skills/` |
| **Cursor** | `.cursor/rules/00-agents-kernel.mdc` | `.cursor/agents/` + `specialist-*.mdc` | via AGENTS + skills path |
| **Codex** | `AGENTS.md` | `.codex/agents/*.toml` | `.agents/skills/` |
| **Antigravity** | `GEMINI.md` + `.agents/rules/` | rules/specialists.md | `.agents/skills/` |
| **Copilot** | `.github/copilot-instructions.md` | (path rules) | `.github/skills/` |
| **Gemini CLI** | `context.fileName`: AGENTS + GEMINI | same | `.agents/skills/` |

Compile: `npm run host:compile`

Clean custom domains: `npm run host:compile -- --clean-domains`
