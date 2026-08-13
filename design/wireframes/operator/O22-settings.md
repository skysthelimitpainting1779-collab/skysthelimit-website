# O22 — Settings

## Contract

- **Surface:** operator
- **Routes:** `/app/settings`
- **Purpose:** Manage governed company, workflow, publication, and environment-safe settings.
- **Audience:** owner, authorized administrator
- **Primary action:** Update governed setting
- **Secondary actions:** Export configuration
- **Server/client boundary:** Secret values are never displayed or stored in public config.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Settings                                                   │
├──────────────────────────────────────────────────────────────┤
│ 01  settings navigation                                      │
├──────────────────────────────────────────────────────────────┤
│ 02  company facts                                            │
├──────────────────────────────────────────────────────────────┤
│ 03  communications                                           │
├──────────────────────────────────────────────────────────────┤
│ 04  workflow policies                                        │
├──────────────────────────────────────────────────────────────┤
│ 05  publication defaults                                     │
├──────────────────────────────────────────────────────────────┤
│ 06  environment metadata                                     │
├──────────────────────────────────────────────────────────────┤
│ 07  audit                                                    │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Settings                   │
├────────────────────────────┤
│ 01 navigation              │
├────────────────────────────┤
│ 02 company                 │
├────────────────────────────┤
│ 03 communications          │
├────────────────────────────┤
│ 04 workflow                │
├────────────────────────────┤
│ 05 publication             │
├────────────────────────────┤
│ 06 audit                   │
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
- validation-error

## Components

- `SettingsNav`
- `FieldGroup`
- `PolicyEditor`
- `Alert`
- `AuditTimeline`

## Marketing skills already selected

- `product-marketing`
- `revops`

## Analytics events

- `settings_view`
- `setting_update`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
