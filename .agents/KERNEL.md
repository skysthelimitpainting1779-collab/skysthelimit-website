# UNIVERSAL AGENT KERNEL (KERNEL.md)
Version: 3.0.0
Authority: Invariant Root for all A-Agents, V-Agents, and Specialists

---

## 1. Graphify-First Codebase Traversal
1. Every codebase discovery, ownership search, dependency trace, error localization, or impact analysis MUST begin with a Graphify query (`npm run graph:query -- "<question>"`).
2. Direct reads (`view_file` / filesystem read) are permitted ONLY for exact files or symbols surfaced by Graphify or explicitly declared in the task contract.
3. Broad discovery via `grep`, `ripgrep`, `grep_search`, or recursive directory globbing is DENIED by default.
4. Fallback search requires an explicit, recorded Graphify Exhaustion Record or `break_glass_justification`.

---

## 2. Context7 API & Blast-Radius Grounding
1. Mandatory when a task touches external library behavior: Next.js 16, React 19, Convex, WorkOS AuthKit, Tailwind 4, Motion 12, Zod 4, Vitest, Playwright, or GitHub Actions.
2. Direct Scope: Query exact current API version via Context7 before implementation.
3. Blast-Radius Scope: If Graphify shows a change affects upstream/downstream domains (e.g. Convex schema change affecting Next.js API route handlers, or UI changes affecting SEO metadata), the agent must ground **all affected technologies in the entire blast radius**.
4. Prohibited for purely internal logic, naming, copy, or proprietary business formulas.

---

## 3. Epistemic Memory Separation (Error Learning)
1. **PROVISIONAL**: Working hypotheses, local trial outcomes, and unverified fixes (agent scratchpad only).
2. **VALIDATED**: Organizational lessons proven by passing automated tests AND an independent clean-context verifier `PASS`. Only validated lessons enter shared `.learnings/`. Stored with commit SHA and invalidated when relevant code changes.

---

## 4. Git & Worktree Discipline
1. Execution occurs in isolated worktrees: `../skys-limit-worktrees/<task-id>-<slug>/`.
2. Direct commits to `main` or `dev` are strictly DENIED.
3. Hard-blocked: `git add .`, `git add -A`, `git commit -a`, `git push --force`, `git reset --hard`, `git clean -fd`, `--no-verify`.
4. Required: Explicit atomic staging (`git add <file>`), conventional commits, exact SHA verification.

---

## 5. Hub-and-Spoke Communication (ACL)
1. A0 is the central orchestrator. Standing agents communicate only with A0.
2. Primary agents may invoke their registered read-only specialist or designated verifier.
3. Worker-to-worker implementation side channels are strictly DENIED (e.g. A4 cannot ask A5 directly to alter Convex schema; report to A0).
4. Verifiers MUST NOT collaborate with implementers or provide implementation hints.

---

## 6. Independent Verification (Blind Clean-Context Evaluation)
1. Verifiers evaluate candidates in a pristine, clean context without parent reasoning, conversational logs, or user goal narratives.
2. Verifier inputs: Task Contract, Base SHA, Candidate SHA, Unified Diff, Acceptance Criteria, Graphify Blast Radius, Grounding Citations, and Test/CI execution logs.
3. Allowed verdicts: `PASS`, `FAIL`, `UNCERTAIN` (both `FAIL` and `UNCERTAIN` block completion).
4. Verifiers possess ZERO write permissions.

---

## 7. Protected Quality Constitution
1. The definition of "Good" sits upstream of agent prompts in `evals/constitution.json`.
2. Agents participating in an improvement loop CANNOT modify metrics, thresholds, rubrics, or held-out cases (`evals/held_out/**`). Write authority: `HUMAN_GOVERNOR_ONLY`.
3. Public score gains that cause held-out regressions are classified as OVERFITTING and immediately rejected.

---

## 8. Bounded Remediation & Circuit Breakers
1. Implementation loop budget: Maximum 3 remediation attempts per task.
2. Each remediation cycle MUST introduce a distinct hypothesis and material diff change.
3. Circuit opens on: 2 identical failures, 2 verifier rejections, budget exhaustion, held-out eval regression, metric tampering attempt, or any secret/production boundary violation.
4. Only A0 can transition a circuit from `OPEN` to `HALF_OPEN`. Workers cannot self-reset.

---

## 9. Production Hard-Stops & Security Boundaries
1. Modifications to `.env.production`, production secrets, or live databases are DENIED.
2. Stripe and Resend runtime activations remain dormant behind feature flags.
3. Main-branch merges require human approval at the GitHub release gate.

---

## 10. Progressive Capability & Skill Loading
1. Layer 1: Universal Kernel (`KERNEL.md`)
2. Layer 2: Domain Plugin rules
3. Layer 3: Task-specific skill selected only when required (e.g. `ui-ux-pro-max`, `taste`, `impeccable`, `convex-development`, `productization`)
4. Layer 4: Narrow, read-only specialist (S1–S8)

---

## 11. Exact-Head Evidence & Truth
1. No completion claim is valid without exact Candidate SHA, Unified Diff vs Base SHA, CI status on candidate SHA, and Verifier verdict on candidate SHA.
2. If CI or preview ran on a different SHA, status is `NOT_VERIFIED`.

---

## 12. Test-First / Red-Green Verification
1. "If the test doesn't fail first, it wasn't testing the correct thing."
2. Proving behavioral fixes requires demonstrating failing test state prior to implementation, followed by green pass on the candidate SHA.
