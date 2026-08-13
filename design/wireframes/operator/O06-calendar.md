# O06 — Calendar

## Contract

- **Surface:** operator
- **Routes:** `/app/calendar`
- **Purpose:** Coordinate appointments and crews with provider reconciliation.
- **Audience:** owner, scheduler
- **Primary action:** Schedule appointment
- **Secondary actions:** Reschedule, Open opportunity/project
- **Server/client boundary:** Provider event receipts reconciled before final state.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Calendar                                                   │
├──────────────────────────────────────────────────────────────┤
│ 01  calendar controls                                        │
├──────────────────────────────────────────────────────────────┤
│ 02  day/week/month view                                      │
├──────────────────────────────────────────────────────────────┤
│ 03  unassigned requests                                      │
├──────────────────────────────────────────────────────────────┤
│ 04  appointment drawer                                       │
├──────────────────────────────────────────────────────────────┤
│ 05  provider health                                          │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Calendar                   │
├────────────────────────────┤
│ 01 date controls           │
├────────────────────────────┤
│ 02 agenda                  │
├────────────────────────────┤
│ 03 unassigned              │
├────────────────────────────┤
│ 04 detail sheet            │
├────────────────────────────┤
│ 05 health                  │
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
- provider-conflict

## Components

- `Calendar`
- `Agenda`
- `AppointmentSheet`
- `IntegrationHealthCard`

## Marketing skills already selected

- `revops`
- `analytics`

## Analytics events

- `calendar_view`
- `appointment_create`
- `appointment_reschedule`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
