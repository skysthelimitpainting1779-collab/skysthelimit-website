# O01 — Operator Overview

## Contract

- **Surface:** operator
- **Routes:** `/app`
- **Purpose:** Prioritize work, risk, and revenue with direct next actions.
- **Audience:** owner, authorized staff
- **Primary action:** Open highest-priority item
- **Secondary actions:** Create lead, Schedule, New estimate
- **Server/client boundary:** Server-authorized staff DTOs; live islands for queue actions.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Operator Overview                                          │
├──────────────────────────────────────────────────────────────┤
│ 01  command bar                                              │
├──────────────────────────────────────────────────────────────┤
│ 02  priority queue                                           │
├──────────────────────────────────────────────────────────────┤
│ 03  pipeline/revenue summary                                 │
├──────────────────────────────────────────────────────────────┤
│ 04  today calendar                                           │
├──────────────────────────────────────────────────────────────┤
│ 05  project risks                                            │
├──────────────────────────────────────────────────────────────┤
│ 06  automation/integration health                            │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Operator Overview          │
├────────────────────────────┤
│ 01 command bar             │
├────────────────────────────┤
│ 02 priority                │
├────────────────────────────┤
│ 03 today                   │
├────────────────────────────┤
│ 04 pipeline                │
├────────────────────────────┤
│ 05 risks                   │
├────────────────────────────┤
│ 06 health                  │
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

- `OperatorShell`
- `PriorityQueue`
- `MetricCard`
- `CalendarSummary`
- `IntegrationHealthCard`

## Marketing skills already selected

- `revops`
- `analytics`
- `marketing-psychology`

## Analytics events

- `operator_overview_view`
- `priority_open`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
