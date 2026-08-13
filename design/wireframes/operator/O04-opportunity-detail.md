# O04 — Opportunity Detail

## Contract

- **Surface:** operator
- **Routes:** `/app/opportunities/[id]`
- **Purpose:** Combine contact, property, scope, activity, tasks, documents, and revenue next step.
- **Audience:** owner, assigned staff
- **Primary action:** Complete next action
- **Secondary actions:** Assign, Create estimate, Schedule
- **Server/client boundary:** Canonical opportunity aggregate.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Opportunity Detail                                         │
├──────────────────────────────────────────────────────────────┤
│ 01  record header/stage                                      │
├──────────────────────────────────────────────────────────────┤
│ 02  next action                                              │
├──────────────────────────────────────────────────────────────┤
│ 03  contact/property                                         │
├──────────────────────────────────────────────────────────────┤
│ 04  scope/intake                                             │
├──────────────────────────────────────────────────────────────┤
│ 05  activity                                                 │
├──────────────────────────────────────────────────────────────┤
│ 06  tasks                                                    │
├──────────────────────────────────────────────────────────────┤
│ 07  documents                                                │
├──────────────────────────────────────────────────────────────┤
│ 08  revenue records                                          │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Opportunity Detail         │
├────────────────────────────┤
│ 01 header                  │
├────────────────────────────┤
│ 02 next action             │
├────────────────────────────┤
│ 03 contact/property        │
├────────────────────────────┤
│ 04 scope                   │
├────────────────────────────┤
│ 05 tasks                   │
├────────────────────────────┤
│ 06 activity                │
├────────────────────────────┤
│ 07 documents               │
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

- `OpportunityHeader`
- `NextActionPanel`
- `ActivityTimeline`
- `TaskList`
- `DocumentList`

## Marketing skills already selected

- `revops`
- `sales-enablement`
- `analytics`

## Analytics events

- `opportunity_view`
- `opportunity_action`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
