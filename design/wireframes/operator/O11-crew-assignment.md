# O11 — Crew Assignment

## Contract

- **Surface:** operator
- **Routes:** `/app/crews`
- **Purpose:** Assign projects and tasks without exposing unauthorized customer data.
- **Audience:** owner, scheduler
- **Primary action:** Assign work
- **Secondary actions:** Review capacity, Open project
- **Server/client boundary:** Assignment grant controls downstream visibility.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Crew Assignment                                            │
├──────────────────────────────────────────────────────────────┤
│ 01  crew/capacity summary                                    │
├──────────────────────────────────────────────────────────────┤
│ 02  unassigned work                                          │
├──────────────────────────────────────────────────────────────┤
│ 03  assignment board                                         │
├──────────────────────────────────────────────────────────────┤
│ 04  conflicts                                                │
├──────────────────────────────────────────────────────────────┤
│ 05  detail drawer                                            │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Crew Assignment            │
├────────────────────────────┤
│ 01 capacity                │
├────────────────────────────┤
│ 02 unassigned              │
├────────────────────────────┤
│ 03 assignments             │
├────────────────────────────┤
│ 04 conflicts               │
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
- conflict

## Components

- `AssignmentBoard`
- `CapacityCard`
- `Alert`
- `Sheet`

## Marketing skills already selected

- `revops`

## Analytics events

- `crew_view`
- `assignment_create`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
