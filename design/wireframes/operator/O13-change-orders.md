# O13 — Change Orders

## Contract

- **Surface:** operator
- **Routes:** `/app/change-orders`
- **Purpose:** Create, send, reconcile, and close scope changes.
- **Audience:** owner, project manager
- **Primary action:** Resolve change
- **Secondary actions:** Create, Send reminder
- **Server/client boundary:** Version and decision evidence required.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Change Orders                                              │
├──────────────────────────────────────────────────────────────┤
│ 01  status summary                                           │
├──────────────────────────────────────────────────────────────┤
│ 02  change table                                             │
├──────────────────────────────────────────────────────────────┤
│ 03  impact preview                                           │
├──────────────────────────────────────────────────────────────┤
│ 04  customer decision state                                  │
├──────────────────────────────────────────────────────────────┤
│ 05  exceptions                                               │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Change Orders              │
├────────────────────────────┤
│ 01 summary                 │
├────────────────────────────┤
│ 02 exceptions              │
├────────────────────────────┤
│ 03 changes                 │
├────────────────────────────┤
│ 04 detail                  │
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
- stale-integration
- reconciliation-required

## Components

- `DataTable`
- `ChangeSummary`
- `DocumentPreview`
- `StatusTimeline`

## Marketing skills already selected

- `offers`
- `revops`
- `emails`

## Analytics events

- `change_orders_view`
- `change_order_create`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
