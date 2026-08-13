# C09 — Change Order

## Contract

- **Surface:** customer
- **Routes:** `/portal/change-orders/[id]`
- **Purpose:** Explain scope, schedule, and price impact before approval.
- **Audience:** authorized project decision-maker
- **Primary action:** Approve or decline change
- **Secondary actions:** Ask question
- **Server/client boundary:** Immutable decision evidence.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Change Order                                               │
├──────────────────────────────────────────────────────────────┤
│ 01  change status                                            │
├──────────────────────────────────────────────────────────────┤
│ 02  reason                                                   │
├──────────────────────────────────────────────────────────────┤
│ 03  scope delta                                              │
├──────────────────────────────────────────────────────────────┤
│ 04  schedule impact                                          │
├──────────────────────────────────────────────────────────────┤
│ 05  price impact                                             │
├──────────────────────────────────────────────────────────────┤
│ 06  evidence                                                 │
├──────────────────────────────────────────────────────────────┤
│ 07  actions                                                  │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Change Order               │
├────────────────────────────┤
│ 01 status                  │
├────────────────────────────┤
│ 02 impact                  │
├────────────────────────────┤
│ 03 action                  │
├────────────────────────────┤
│ 04 reason                  │
├────────────────────────────┤
│ 05 evidence                │
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
- approved
- declined
- superseded

## Components

- `ChangeSummary`
- `DocumentApproval`
- `Alert`
- `MediaGallery`

## Marketing skills already selected

- `offers`
- `copywriting`
- `marketing-psychology`

## Analytics events

- `change_order_view`
- `change_order_decision`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
