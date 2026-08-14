---
trigger: always_on
description: Thin Antigravity adapter — points to KERNEL.md as canonical source. Kernel rules apply to all agents.
---

# STL Engineering Kernel

All agents inherit `.agents/KERNEL.md` as the canonical source of truth.

**Hard rules summary (see KERNEL.md for full detail):**
1. Graphify before discovery — not before every file read
2. Context7 for external API behavior — not internal logic
3. Surgical `git add <file>` only
4. Hub-and-spoke: workers → A0, not workers → workers
5. Loop caps: impl 3, remediation 3, verifier 2, specialist 1
6. Production hard-stops: no `deploy --prod`, no force-push to `main`
