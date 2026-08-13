# C01 — Customer Overview

## Contract

- **Surface:** customer
- **Routes:** `/portal`
- **Purpose:** Show project status and one most important next action.
- **Audience:** authenticated customer
- **Primary action:** Open next action
- **Secondary actions:** View project, Message
- **Server/client boundary:** Server-authorized DTO; client islands for interactions.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Customer Overview                                          │
├──────────────────────────────────────────────────────────────┤
│ 01  app shell                                                │
├──────────────────────────────────────────────────────────────┤
│ 02  next-action panel                                        │
├──────────────────────────────────────────────────────────────┤
│ 03  project summary                                          │
├──────────────────────────────────────────────────────────────┤
│ 04  appointments/documents/payments                          │
├──────────────────────────────────────────────────────────────┤
│ 05  timeline                                                 │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Customer Overview          │
├────────────────────────────┤
│ 01 header                  │
├────────────────────────────┤
│ 02 next action             │
├────────────────────────────┤
│ 03 project                 │
├────────────────────────────┤
│ 04 timeline                │
├────────────────────────────┤
│ 05 documents/payments      │
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

- `AppShell`
- `NextActionPanel`
- `ProjectSummary`
- `StatusTimeline`
- `Card`

## Marketing skills already selected

- `onboarding`
- `cro`
- `copywriting`

## Analytics events

- `portal_view`
- `next_action_open`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
