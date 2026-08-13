---
name: anti-slop-ui-review
description: Mandatory final review for all public, portal, and operator UI. Detects generic AI aesthetics, unjustified patterns, fake proof, weak hierarchy, unnecessary cards, ornamental gradients, vague copy, and unmaintainable visual code.
---

# Anti-Slop UI Review

## Review order

1. Business truth and proof
2. Information hierarchy
3. Task clarity
4. Design-system alignment
5. Responsive behavior
6. Accessibility
7. Motion purpose
8. Visual originality
9. Code maintainability

## Automatic failures

- Fabricated proof, metrics, reviews, or project media
- Generic purple/blue AI gradients contrary to `DESIGN.md`
- `transition-all`
- Global radius overrides
- Raw PII in UI URLs, logs, storage, or analytics
- Missing keyboard focus
- Missing mobile design
- Arbitrary dashboard styling copied from landing-page rules
- Bypassing the active wireframe
- Styling that makes a destructive or irreversible action ambiguous

## Mandatory commands

```bash
npm run lint:design:changed
npm run lint:slop
```

Warnings must be reviewed and addressed or explicitly justified in the node evidence. Do not suppress findings with broad ignore rules.

Use Impeccable `audit`, `harden`, and `polish` after implementation. For public marketing, also use the pinned Taste and redesign skills.
