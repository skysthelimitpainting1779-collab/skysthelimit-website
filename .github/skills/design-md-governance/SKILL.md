---
name: design-md-governance
description: Mandatory for every UI change. Enforces DESIGN.md, route wireframes, page-state contracts, component rules, approved design changes, and design lint evidence.
---

# DESIGN.md Governance

Before editing UI:

1. Read `DESIGN.md`.
2. Read the matching entry in `design/PAGE_SPECS.json`.
3. Read the matching wireframe.
4. Record the current `DESIGN.md` SHA-256.
5. Identify the surface: public marketing, customer portal, or operator cockpit.
6. Load the required design and technical skills from
   `docs/design/DESIGN_SKILL_ROUTING.json`.

Do not infer a new visual direction. The design is implementation-locked.

Run:

```bash
npm run lint:design
npm run lint:design:changed
```

Any `DESIGN.md` change requires `design/DESIGN_CHANGELOG.md` entries containing:

```text
DESIGN-SHA256: <new hash>
APPROVED-BY: <named approver>
REASON: <verified reason>
```

A UI node is incomplete without desktop/mobile screenshots, accessibility checks, lint reports, and its design evidence JSON.
