---
name: repeatable-workflow-capture
description: Capture any workflow that is being performed a second time, or is already expected to recur, as a concise repository skill before repeating it. Use for recurring codebase operations, provider setup, verification, migrations, release procedures, audits, and multi-step maintenance.
---

# Repeatable Workflow Capture

Before performing a workflow for the second time, create or update a skill under `.agents/skills/<skill-name>/`.

1. Search existing skill names and descriptions first. Extend the closest skill when its trigger and ownership match.
2. Record only non-obvious, reusable procedure: prerequisites, safety boundaries, ordered actions, verification, rollback, and evidence.
3. Add a deterministic script when commands or transformations would otherwise be rewritten.
4. Keep `SKILL.md` concise; place detailed provider or schema material in one-level `references/` files.
5. Validate the skill with the system `quick_validate.py`.
6. Run `npm run skills:validate` and `npm run host:compile`.
7. Execute the recurring workflow through the skill from then on.

Do not create skills for isolated facts or trivial one-line edits. A planned repeated operation, a second execution, or a reusable failure-recovery sequence always crosses the capture threshold.
