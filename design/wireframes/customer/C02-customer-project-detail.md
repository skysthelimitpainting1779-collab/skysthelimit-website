# C02 — Customer Project Detail

## Contract

- **Surface:** customer
- **Routes:** `/portal/projects/[id]`
- **Purpose:** Provide one project source of truth for status, scope, schedule, files, and approvals.
- **Audience:** project customer
- **Primary action:** Complete project next action
- **Secondary actions:** Message, Open files
- **Server/client boundary:** Explicit project grant required.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Customer Project Detail                                    │
├──────────────────────────────────────────────────────────────┤
│ 01  project header                                           │
├──────────────────────────────────────────────────────────────┤
│ 02  status/timeline                                          │
├──────────────────────────────────────────────────────────────┤
│ 03  scope                                                    │
├──────────────────────────────────────────────────────────────┤
│ 04  schedule                                                 │
├──────────────────────────────────────────────────────────────┤
│ 05  approvals                                                │
├──────────────────────────────────────────────────────────────┤
│ 06  files                                                    │
├──────────────────────────────────────────────────────────────┤
│ 07  updates                                                  │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Customer Project Detail    │
├────────────────────────────┤
│ 01 header                  │
├────────────────────────────┤
│ 02 next action             │
├────────────────────────────┤
│ 03 status                  │
├────────────────────────────┤
│ 04 scope                   │
├────────────────────────────┤
│ 05 approvals               │
├────────────────────────────┤
│ 06 files                   │
├────────────────────────────┤
│ 07 updates                 │
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

## Components

- `PropertyHeader`
- `StatusTimeline`
- `ScopeSummary`
- `DocumentList`
- `NextActionPanel`

## Marketing skills already selected

- `onboarding`
- `copywriting`

## Analytics events

- `portal_project_view`
- `project_action_open`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
