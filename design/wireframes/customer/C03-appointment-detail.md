# C03 — Appointment Detail

## Contract

- **Surface:** customer
- **Routes:** `/portal/appointments/[id]`
- **Purpose:** Show confirmed appointment facts and controlled reschedule/cancel actions.
- **Audience:** appointment participant
- **Primary action:** Confirm or reschedule
- **Secondary actions:** Add to calendar, Contact
- **Server/client boundary:** Provider state reconciled server-side.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Appointment Detail                                         │
├──────────────────────────────────────────────────────────────┤
│ 01  appointment facts                                        │
├──────────────────────────────────────────────────────────────┤
│ 02  property/context                                         │
├──────────────────────────────────────────────────────────────┤
│ 03  preparation instructions                                 │
├──────────────────────────────────────────────────────────────┤
│ 04  actions                                                  │
├──────────────────────────────────────────────────────────────┤
│ 05  history                                                  │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Appointment Detail         │
├────────────────────────────┤
│ 01 facts                   │
├────────────────────────────┤
│ 02 action                  │
├────────────────────────────┤
│ 03 instructions            │
├────────────────────────────┤
│ 04 history                 │
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
- provider-stale

## Components

- `AppointmentCard`
- `CalendarActions`
- `Alert`
- `StatusTimeline`

## Marketing skills already selected

- `onboarding`
- `emails`
- `sms`

## Analytics events

- `appointment_view`
- `appointment_reschedule_start`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
