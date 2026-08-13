# O21 — Users / Roles

## Contract

- **Surface:** operator
- **Routes:** `/app/users`
- **Purpose:** Manage invitations, roles, MFA requirements, status, and resource grants.
- **Audience:** owner, user administrator
- **Primary action:** Manage invitation or role
- **Secondary actions:** Disable user, Review grants
- **Server/client boundary:** Owner-only privileged administration.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Users / Roles                                              │
├──────────────────────────────────────────────────────────────┤
│ 01  user summary                                             │
├──────────────────────────────────────────────────────────────┤
│ 02  user table                                               │
├──────────────────────────────────────────────────────────────┤
│ 03  invitation panel                                         │
├──────────────────────────────────────────────────────────────┤
│ 04  role/grant detail                                        │
├──────────────────────────────────────────────────────────────┤
│ 05  MFA/status                                               │
├──────────────────────────────────────────────────────────────┤
│ 06  audit                                                    │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Users / Roles              │
├────────────────────────────┤
│ 01 summary                 │
├────────────────────────────┤
│ 02 invitations             │
├────────────────────────────┤
│ 03 users                   │
├────────────────────────────┤
│ 04 detail                  │
├────────────────────────────┤
│ 05 audit                   │
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
- invite-pending
- disabled
- MFA-required

## Components

- `DataTable`
- `InviteDialog`
- `RoleEditor`
- `GrantTable`
- `AuditTimeline`

## Marketing skills already selected

- `onboarding`
- `signup`

## Analytics events

- `users_view`
- `invite_send`
- `role_change`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
