# C10 — Messages / Updates

## Contract

- **Surface:** customer
- **Routes:** `/portal/messages`
- **Purpose:** Provide a controlled project update stream and customer response channel.
- **Audience:** project customer
- **Primary action:** Read or send update
- **Secondary actions:** Open referenced record
- **Server/client boundary:** Messages are project-scoped and audited.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Messages / Updates                                         │
├──────────────────────────────────────────────────────────────┤
│ 01  thread/project selector                                  │
├──────────────────────────────────────────────────────────────┤
│ 02  message timeline                                         │
├──────────────────────────────────────────────────────────────┤
│ 03  composer                                                 │
├──────────────────────────────────────────────────────────────┤
│ 04  attachments                                              │
├──────────────────────────────────────────────────────────────┤
│ 05  notification settings                                    │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Messages / Updates         │
├────────────────────────────┤
│ 01 project                 │
├────────────────────────────┤
│ 02 messages                │
├────────────────────────────┤
│ 03 composer                │
├────────────────────────────┤
│ 04 settings                │
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
- sending
- delivery-error

## Components

- `MessageThread`
- `Composer`
- `Upload`
- `StatusBadge`

## Marketing skills already selected

- `emails`
- `sms`
- `onboarding`

## Analytics events

- `messages_view`
- `message_send`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
