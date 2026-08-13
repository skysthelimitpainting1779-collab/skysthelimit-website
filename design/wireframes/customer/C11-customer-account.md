# C11 — Customer Account

## Contract

- **Surface:** customer
- **Routes:** `/portal/settings`
- **Purpose:** Manage identity-facing preferences without changing resource ownership implicitly.
- **Audience:** authenticated customer
- **Primary action:** Manage account
- **Secondary actions:** Notification preferences, Support
- **Server/client boundary:** Clerk identity; ownership changes require explicit reviewed process.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Customer Account                                           │
├──────────────────────────────────────────────────────────────┤
│ 01  profile                                                  │
├──────────────────────────────────────────────────────────────┤
│ 02  identity/security                                        │
├──────────────────────────────────────────────────────────────┤
│ 03  notifications                                            │
├──────────────────────────────────────────────────────────────┤
│ 04  authorized relationships                                 │
├──────────────────────────────────────────────────────────────┤
│ 05  support                                                  │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Customer Account           │
├────────────────────────────┤
│ 01 profile                 │
├────────────────────────────┤
│ 02 security                │
├────────────────────────────┤
│ 03 notifications           │
├────────────────────────────┤
│ 04 relationships           │
├────────────────────────────┤
│ 05 support                 │
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

- `Profile`
- `SecurityPanel`
- `NotificationSettings`
- `Alert`

## Marketing skills already selected

- `onboarding`

## Analytics events

- `account_view`
- `notification_update`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
