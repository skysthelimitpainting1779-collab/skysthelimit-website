# C04 — Estimate Review

## Contract

- **Surface:** customer
- **Routes:** `/portal/estimates/[id]`
- **Purpose:** Present a versioned estimate with scope, assumptions, exclusions, and next step.
- **Audience:** project customer
- **Primary action:** Acknowledge estimate
- **Secondary actions:** Ask question, Download
- **Server/client boundary:** Authorized DTO; immutable issued version.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Estimate Review                                            │
├──────────────────────────────────────────────────────────────┤
│ 01  document header/version                                  │
├──────────────────────────────────────────────────────────────┤
│ 02  scope                                                    │
├──────────────────────────────────────────────────────────────┤
│ 03  line groups                                              │
├──────────────────────────────────────────────────────────────┤
│ 04  assumptions/exclusions                                   │
├──────────────────────────────────────────────────────────────┤
│ 05  range/total                                              │
├──────────────────────────────────────────────────────────────┤
│ 06  actions                                                  │
├──────────────────────────────────────────────────────────────┤
│ 07  history                                                  │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Estimate Review            │
├────────────────────────────┤
│ 01 header                  │
├────────────────────────────┤
│ 02 total                   │
├────────────────────────────┤
│ 03 action                  │
├────────────────────────────┤
│ 04 scope                   │
├────────────────────────────┤
│ 05 assumptions             │
├────────────────────────────┤
│ 06 history                 │
└────────────────────────────┘
```

## Required states

- loading
- empty
- populated
- partial
- error
- permission-denied
- disabled-account
- superseded

## Components

- `DocumentSurface`
- `ScopeSummary`
- `EstimateLines`
- `Alert`
- `ApprovalActions`

## Marketing skills already selected

- `offers`
- `pricing`
- `copywriting`

## Analytics events

- `estimate_view`
- `estimate_acknowledge`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
