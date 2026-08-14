# Git & Worktree Engineering Discipline

**Scope:** Universal across all code-writing agents (A0, A4, A5, A6, A7, A8).

---

## 1. Single Writer & Worktree Isolation Rule
Every active code-writing task MUST operate in an isolated branch and worktree:
- **One Work Item** → **One Branch** (`feat/SKY-XX-topic`, `fix/SKY-XX-topic`) → **One Isolated Worktree** → **One Active Writer**.
- **No Direct Commits**: Implementation directly on `main` or `dev` is strictly prohibited and physically blocked by hooks.

---

## 2. Hard Git Prohibitions
The following destructive or sloppy commands are hard-denied by PreToolUse safety hooks:
- `git add .` or `git add -A` (must use explicit, surgical file staging: `git add <path>`)
- `git commit -a` (bypasses inspection)
- `git push --force` or `git push -f`
- `git reset --hard` (risk of untracked change loss)
- `git clean -fd`
- Bypassing repository hooks (`--no-verify`, `HUSKY=0`)
- Unscoped file checkouts / restores (`git restore .`)

---

## 3. Atomic Verification Standard
Before requesting verifier review:
1. Verify clean git working tree (`git status` shows only tracked changes intended for candidate).
2. Record exact candidate commit SHA (`git rev-parse HEAD`).
3. Run local automated pre-delivery gates (`npm run lint`, `npm test`).
