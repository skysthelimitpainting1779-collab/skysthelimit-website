---
trigger: never
description: Workspace integrity standards — process hygiene, workspace isolation, pathing, syntax validation, banned patterns.
---

# Workspace Guidelines & Anomaly Ontology

## Enforced Standards
- **Process Hygiene**: Terminate all background compilers/watchers via `manage_task` before subagent shutdown (prevents Windows dir lockups).
- **Workspace Isolation**: Multi-step refactors use `invoke_subagent` with `Workspace: 'share'` — never modify main branch directly.
- **Path Normalization**: Convert `\` → `/` in all programmatic path strings; strip drive letters during permission evaluation.
- **Syntax Validation**: Run `node --check <file>` before staging any `.js` file. Hard gate — do not declare done until exit 0.
- **PowerShell Escaping**: Never `echo '{"key":"val"}' > file.json` in PowerShell — single quotes don't preserve double quotes. Use `write_to_file` tool instead.
- **No-Clone Rule**: For GitHub/Linear triggers, run inside existing repo via `invoke_subagent --workspace=share`. Never `git clone`.
- **Hooks > MCP**: `hooks.json` is the primary enforcement layer (proactive, deterministic). MCP is secondary (reactive, optional).
- **Vercel Build Errors**: `[0ms]` build = config-stage failure. Run `vercel inspect <url> --logs` — never guess from status alone.
- **next/dynamic + ssr:false Ban**: Never wrap `@vercel/analytics` or `@vercel/speed-insights` in `next/dynamic({ssr:false})`. Import as RSC components directly.
- **Middleware Export Name**: `src/middleware.ts` MUST export `export async function middleware(request)`. Any other name is silently ignored.
- **Character Limit**: Rule files must stay below 12,000 characters. Never commit log dumps or stack traces into rule files.
