# O02 — Lead Inbox

## Contract

- **Surface:** operator
- **Routes:** `/app/leads`
- **Purpose:** Triage new and unresolved intake with SLA visibility.
- **Audience:** owner, sales/office staff
- **Primary action:** Qualify lead
- **Secondary actions:** Assign, Archive duplicate
- **Server/client boundary:** Staff grant required; bulk destructive actions separately confirmed.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Lead Inbox                                                 │
├──────────────────────────────────────────────────────────────┤
│ 01  filters/search                                           │
├──────────────────────────────────────────────────────────────┤
│ 02  lead table                                               │
├──────────────────────────────────────────────────────────────┤
│ 03  SLA/quality indicators                                   │
├──────────────────────────────────────────────────────────────┤
│ 04  preview/detail drawer                                    │
├──────────────────────────────────────────────────────────────┤
│ 05  bulk-safe actions                                        │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Lead Inbox                 │
├────────────────────────────┤
│ 01 filters                 │
├────────────────────────────┤
│ 02 priority rows           │
├────────────────────────────┤
│ 03 detail sheet            │
├────────────────────────────┤
│ 04 actions                 │
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
- duplicate
- delivery-failed

## Components

- `DataTable`
- `Command`
- `LeadQuality`
- `Sheet`
- `Badge`

## Marketing skills already selected

- `revops`
- `analytics`

## Analytics events

- `lead_inbox_view`
- `lead_open`
- `lead_qualify`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
