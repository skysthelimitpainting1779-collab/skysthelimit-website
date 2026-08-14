---
trigger: always_on
description: Antigravity schema enforcement — file placement and required frontmatter for workflows, rules, and skills.
---

# Antigravity Schema Requirements

| Type | Location | Required Frontmatter Keys |
|------|----------|--------------------------|
| Workflow | `.agents/workflows/<name>.md` | `name`, `description` |
| Rule | `.agents/rules/<name>.md` | `trigger`, `description` |
| Skill | `.agents/skills/<name>/SKILL.md` | `name`, `description` |

- Filenames: lowercase, no spaces.
- Workflows CANNOT go in `plugins/<name>/workflows/`.
- Missing any required key = hard `DENY` from the IDE engine.
