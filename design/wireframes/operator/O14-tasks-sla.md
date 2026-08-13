# O14 — Tasks / SLA

## Contract

- **Surface:** operator
- **Routes:** `/app/tasks`
- **Purpose:** Make due work visible and connect every task to a canonical record.
- **Audience:** owner, staff
- **Primary action:** Complete due action
- **Secondary actions:** Assign, Snooze with reason
- **Server/client boundary:** Snooze and completion audited.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Tasks / SLA                                                │
├──────────────────────────────────────────────────────────────┤
│ 01  task filters                                             │
├──────────────────────────────────────────────────────────────┤
│ 02  priority/due groups                                      │
├──────────────────────────────────────────────────────────────┤
│ 03  task list                                                │
├──────────────────────────────────────────────────────────────┤
│ 04  record preview                                           │
├──────────────────────────────────────────────────────────────┤
│ 05  completion history                                       │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Tasks / SLA                │
├────────────────────────────┤
│ 01 priority                │
├────────────────────────────┤
│ 02 due                     │
├────────────────────────────┤
│ 03 tasks                   │
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
- overdue

## Components

- `TaskList`
- `FilterBar`
- `RecordPreview`
- `Badge`

## Marketing skills already selected

- `revops`
- `analytics`

## Analytics events

- `tasks_view`
- `task_complete`
- `task_snooze`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
