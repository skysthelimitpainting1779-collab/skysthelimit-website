---
name: context7-contract-governance
description: Require and record a live Context7 library contract before changing behavior that depends on an external library, framework, provider, API, CLI, or cloud service.
---

# Context7 Contract Governance

Use during goal research before external behavior is designed or changed.

1. Query Context7 live and select the official library ID.
2. Record the exact behavior-affecting contract under `## Context7 contracts` in the active goal's `research.md`.
3. Use this format:

```markdown
## Context7 contracts

- Library ID: `/owner/library`
- Contract: Concise behavior that constrains this change.
```

When no external dependency is involved, record `Applicability: not-applicable — <reason>`.
Cached recollection, generic web search, and an unqualified provider name do not satisfy the gate.

Run `npm run context7:verify`; `npm run goal:verify` runs the same check first.

