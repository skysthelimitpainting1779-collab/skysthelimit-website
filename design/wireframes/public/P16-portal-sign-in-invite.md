# P16 — Portal Sign-in / Invite

## Contract

- **Surface:** public
- **Routes:** `/portal/login`
- **Purpose:** Authenticate customers and accept invitations without open staff registration.
- **Audience:** customer, invited staff
- **Primary action:** Sign in or accept invite
- **Secondary actions:** Get help
- **Server/client boundary:** Clerk client components with server route protection and Convex identity sync.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Portal Sign-in / Invite                                    │
├──────────────────────────────────────────────────────────────┤
│ 01  brand/context panel                                      │
├──────────────────────────────────────────────────────────────┤
│ 02  auth panel                                               │
├──────────────────────────────────────────────────────────────┤
│ 03  privacy/security note                                    │
├──────────────────────────────────────────────────────────────┤
│ 04  support                                                  │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Portal Sign-in / Invite    │
├────────────────────────────┤
│ 01 brand                   │
├────────────────────────────┤
│ 02 auth                    │
├────────────────────────────┤
│ 03 support                 │
└────────────────────────────┘
```

## Required states

- loading
- sign-in
- invite-valid
- invite-invalid
- MFA
- disabled
- error

## Components

- `ClerkAuth`
- `Alert`
- `Button`
- `SupportLink`

## Marketing skills already selected

- `signup`
- `onboarding`
- `copywriting`

## Analytics events

- `auth_view`
- `auth_success`
- `invite_accept`
- `auth_error`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
