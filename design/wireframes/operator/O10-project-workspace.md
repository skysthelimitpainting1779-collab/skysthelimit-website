# O10 — Project Workspace

## Contract

- **Surface:** operator
- **Routes:** `/app/projects/[id]`
- **Purpose:** Operate project scope, schedule, assignments, updates, files, approvals, and closeout.
- **Audience:** owner, assigned staff
- **Primary action:** Advance project
- **Secondary actions:** Assign crew, Add update, Create change order
- **Server/client boundary:** Every customer-visible fact explicitly marked.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Project Workspace                                          │
├──────────────────────────────────────────────────────────────┤
│ 01  project header/status                                    │
├──────────────────────────────────────────────────────────────┤
│ 02  next action                                              │
├──────────────────────────────────────────────────────────────┤
│ 03  scope/schedule                                           │
├──────────────────────────────────────────────────────────────┤
│ 04  crew                                                     │
├──────────────────────────────────────────────────────────────┤
│ 05  timeline                                                 │
├──────────────────────────────────────────────────────────────┤
│ 06  files                                                    │
├──────────────────────────────────────────────────────────────┤
│ 07  changes                                                  │
├──────────────────────────────────────────────────────────────┤
│ 08  customer visibility                                      │
├──────────────────────────────────────────────────────────────┤
│ 09  closeout                                                 │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Project Workspace          │
├────────────────────────────┤
│ 01 header                  │
├────────────────────────────┤
│ 02 next action             │
├────────────────────────────┤
│ 03 schedule                │
├────────────────────────────┤
│ 04 crew                    │
├────────────────────────────┤
│ 05 timeline                │
├────────────────────────────┤
│ 06 files                   │
├────────────────────────────┤
│ 07 changes                 │
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

- `ProjectHeader`
- `NextActionPanel`
- `Schedule`
- `AssignmentBoard`
- `StatusTimeline`
- `DocumentList`

## Marketing skills already selected

- `revops`
- `onboarding`
- `analytics`

## Analytics events

- `project_workspace_view`
- `project_status_change`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
