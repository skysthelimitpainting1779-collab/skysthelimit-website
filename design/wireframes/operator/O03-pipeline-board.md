# O03 — Pipeline Board

## Contract

- **Surface:** operator
- **Routes:** `/app/pipeline`
- **Purpose:** Visualize and advance opportunities through explicit stages.
- **Audience:** owner, sales staff
- **Primary action:** Move opportunity
- **Secondary actions:** Filter, Open detail
- **Server/client boundary:** Server validates every transition.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Pipeline Board                                             │
├──────────────────────────────────────────────────────────────┤
│ 01  pipeline controls                                        │
├──────────────────────────────────────────────────────────────┤
│ 02  stage columns                                            │
├──────────────────────────────────────────────────────────────┤
│ 03  opportunity cards                                        │
├──────────────────────────────────────────────────────────────┤
│ 04  totals                                                   │
├──────────────────────────────────────────────────────────────┤
│ 05  stale/SLA indicators                                     │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Pipeline Board             │
├────────────────────────────┤
│ 01 stage selector          │
├────────────────────────────┤
│ 02 cards                   │
├────────────────────────────┤
│ 03 totals                  │
├────────────────────────────┤
│ 04 filters                 │
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

- `Kanban`
- `OpportunityCard`
- `Badge`
- `FilterBar`

## Marketing skills already selected

- `revops`
- `analytics`

## Analytics events

- `pipeline_view`
- `stage_change`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
