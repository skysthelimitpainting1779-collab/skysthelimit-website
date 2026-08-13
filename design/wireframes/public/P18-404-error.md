# P18 — 404 / Error

## Contract

- **Surface:** public
- **Routes:** `/404`, `/error`
- **Purpose:** Recover from an invalid or failed route with useful next actions.
- **Audience:** any user
- **Primary action:** Return to valid path
- **Secondary actions:** Estimate, Call
- **Server/client boundary:** Server error boundary where possible; no canonical/indexable metadata.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ 404 / Error                                                │
├──────────────────────────────────────────────────────────────┤
│ 01  status code/title                                        │
├──────────────────────────────────────────────────────────────┤
│ 02  plain explanation                                        │
├──────────────────────────────────────────────────────────────┤
│ 03  recommended links                                        │
├──────────────────────────────────────────────────────────────┤
│ 04  contact action                                           │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ 404 / Error                │
├────────────────────────────┤
│ 01 status                  │
├────────────────────────────┤
│ 02 explanation             │
├────────────────────────────┤
│ 03 links                   │
├────────────────────────────┤
│ 04 contact                 │
└────────────────────────────┘
```

## Required states

- 404
- 500
- offline
- maintenance

## Components

- `Empty`
- `Alert`
- `Button`

## Marketing skills already selected

- `copywriting`
- `cro`

## Analytics events

- `error_view`
- `error_recovery_click`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
