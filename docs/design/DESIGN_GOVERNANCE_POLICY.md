
# Mandatory Design Governance

This policy is binding for B25, B31 UI, B30, and B50.

## Source of truth

`DESIGN.md`, `design/PAGE_SPECS.json`, and the matching wireframe are mandatory inputs. No UI file may be edited from memory or generic style preference.

## Required design stack

### Every UI surface

- `design-md-governance`
- `ui-ux-pro-max`
- `impeccable`
- `anti-slop-ui-review`
- technical primary skill
- React, Next.js, shadcn, accessibility, and verification skills as mapped

### Public marketing

Also require the full Taste bundle, including:

- `design-taste-frontend`
- `redesign-skill`
- Codex/GPT taste variant when included by the pinned bundle

### Product/dashboard surfaces

Taste’s public landing-page implementation rules are not blindly applied to portal or operator dashboards. The evidence ledger must record `not-applied-scope-exclusion`, then use Impeccable’s product lane and UI/UX Pro Max.

## Required Impeccable passes

For every meaningful UI node:

1. `shape` or equivalent pre-implementation critique
2. `audit`
3. `harden`
4. `polish`

Public redesign work additionally receives `critique` and `distill` where clutter is detected.

## No skill voting

Skills are not competing art directors. Conflict resolution order:

1. Verified user requirement and business truth
2. `DESIGN.md` and route wireframe
3. Accessibility, security, privacy, and performance
4. UI/UX Pro Max structured recommendation
5. Impeccable critique and anti-pattern rules
6. Taste recommendations within its declared scope

A lower item may improve execution but may not override a higher item without a logged design change.

## Evidence

Every UI node writes `.agents/evidence/design/<node-id>.json` and includes:

- routes and surface
- `DESIGN.md` SHA-256
- wireframe/template ID
- technical and design skills loaded
- UI/UX Pro Max queries/recommendations used
- Impeccable passes completed
- Taste disposition
- design-lint report
- anti-slop report
- desktop and mobile screenshots
- keyboard/focus/reduced-motion evidence
- Vercel preview URL and deployment ID when available
- approved deviations
