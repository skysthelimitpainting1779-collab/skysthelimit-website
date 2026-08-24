# Agent OS unified hooks

One runner: `node scripts/hooks/run.mjs <event>`

## End-to-end logic

```text
SessionStart
  → rebuild .learnings/ACTIVE_CONTEXT.md
  → inject top lessons + ROOT_CAUSE (stdout JSON additionalContext)
  → remind: graphify / codebase-memory first
  → Entire session-start (if present)

UserPromptSubmit
  → re-inject compact active-prevention context

BeforeTool / PreToolUse (Bash|Write|Edit|…)
  → DENY known-bad patterns (ssr:false, nested powershell, System32 soft-skip)
  → soft remind: graphify query before raw grep/read

Tool runs (edit/write)
  → AfterTool / PostToolUse
  → debounced graphify update .

Stop / SessionEnd
  → session-learn close (debounced) → rebuild ACTIVE_CONTEXT
  → Entire session-end + entire-to-agentos

git commit (Husky)
  → Entire checkpoint trailers
  → entire-to-agentos (force)
  → graphify (chained pre-entire)
```

## Events

| Event | Hosts | Action |
|-------|--------|--------|
| `pre-explore` | any | stderr guidance |
| `post-edit` | Gemini AfterTool, Claude PostToolUse | debounced graphify |
| `post-session` | SessionEnd | entire-to-agentos |
| `post-commit-full` | Husky post-commit | force entire-to-agentos |
| `claude-pre-tool` | Claude PreToolUse | **deny** known-bad + additionalContext |
| `claude-post-tool` | Claude PostToolUse | post-edit if write tool |
| `session-start` / `session-end` | Gemini / Claude | inject ACTIVE_CONTEXT / sync |
| `user-prompt-submit` | Claude UserPromptSubmit | re-inject lessons |
| `session-learn` | Claude Stop | full learn close + prevent rebuild |

## Env

- `HOOKS_SKIP=1` — disable all
- `GRAPHIFY_SKIP_HOOK=1` — skip graphify
- `ENTIRE_SYNC_SKIP=1` — skip codify
- `ACTIVE_PREVENTION_SKIP=1` — skip inject/deny
- `ACTIVE_PREVENTION_SOFT=1` — advise only (no deny)
- `HOOKS_GRAPHIFY_DEBOUNCE_MS` — default 90000
- `HOOKS_VERBOSE=1` — log results

## Active prevention

See `scripts/active-prevention.mjs` and iron law **14** in `.agents/AGENTS.md`.
Lessons are not passive logs — SessionStart injects them and PreToolUse blocks repeats.

## Windows bash + Claude plugins (semgrep / remember)

### ROOT CAUSE (fix this first)

Bare `bash` was **WSL** `C:\Windows\System32\bash.exe` because **Machine PATH** listed System32 before Git. Wrappers that soft-skip are **symptoms** — forbidden as the only fix (`.agents/governance/ROOT_CAUSE.md`).

```powershell
# Admin — durable Machine PATH fix
npm run hooks:fix-bash-path
# or:
powershell -ExecutionPolicy Bypass -File scripts/fix-windows-bash-path.ps1
```

**Verify (must pass without wrappers):**

```text
where bash
→ C:\Program Files\Git\bin\bash.exe   (first)

bash --version
→ GNU bash, version …

npm run agentos:health
→ bash.ok: true
```

Restart terminals / Claude after PATH change.

### Defense-in-depth only (after PATH is fixed)

Plugin re-apply after Claude updates plugins (not a substitute for PATH):

```bash
npm run hooks:patch-windows
```

Semgrep not logged into Guardian: log in via guardian MCP for real scans — do not leave permanent soft-allow as the “fix” if you need blocking SAST.

## Debounce state

`.agents/hooks-state.json`
