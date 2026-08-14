# Engineering Memory & Error Learning Protocol

**Scope:** Universal across all standing agents and verifiers.

---

## 1. Dual-Tier Memory Classification
Engineering findings and error resolutions must be cataloged into two explicit trust levels:

### Tier 1: `PROVISIONAL`
- Findings, hypotheses, or unverified fixes generated during an active investigation turn.
- Stored locally in the active session context (`.learnings/PROVISIONAL_*.json`).
- NOT treated as universal truth across the team until verified.

### Tier 2: `VALIDATED`
- Formally confirmed architectural lessons and root-cause solutions.
- Promotion requires:
  1. Implementation completed.
  2. Proving tests passed.
  3. Clean-context blind verifier issued a `PASS` verdict.
- Stored in persistent repository memory (`.learnings/ERRORS.md` and `.learnings/index.json`) tagged with candidate SHA and scope.

---

## 2. Stale Memory Invalidation
Validated memory entries are automatically marked `STALE` when:
- Material source files referenced in the entry are modified in subsequent commits.
- Upstream external library dependencies undergo major/minor version increments.
