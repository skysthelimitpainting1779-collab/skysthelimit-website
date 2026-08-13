# O09 — Agreement / Payment Monitor

## Contract

- **Surface:** operator
- **Routes:** `/app/revenue`
- **Purpose:** Show proposal, agreement, checkout, payment, refund, and reconciliation status.
- **Audience:** owner, finance-authorized staff
- **Primary action:** Resolve revenue state
- **Secondary actions:** Open agreement, Open Stripe record
- **Server/client boundary:** Canonical payment facts from verified webhooks.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Agreement / Payment Monitor                                │
├──────────────────────────────────────────────────────────────┤
│ 01  revenue filters                                          │
├──────────────────────────────────────────────────────────────┤
│ 02  state summary                                            │
├──────────────────────────────────────────────────────────────┤
│ 03  records table                                            │
├──────────────────────────────────────────────────────────────┤
│ 04  exceptions                                               │
├──────────────────────────────────────────────────────────────┤
│ 05  detail drawer                                            │
├──────────────────────────────────────────────────────────────┤
│ 06  reconciliation                                           │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Agreement / Payment Monito │
├────────────────────────────┤
│ 01 summary                 │
├────────────────────────────┤
│ 02 exceptions              │
├────────────────────────────┤
│ 03 records                 │
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
- signature-pending
- payment-pending
- mismatch

## Components

- `MetricCard`
- `DataTable`
- `ReconciliationPanel`
- `Alert`

## Marketing skills already selected

- `revops`
- `analytics`

## Analytics events

- `revenue_monitor_view`
- `revenue_exception_open`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
