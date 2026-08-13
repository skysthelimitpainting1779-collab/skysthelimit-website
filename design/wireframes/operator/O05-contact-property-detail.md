# O05 — Contact / Property Detail

## Contract

- **Surface:** operator
- **Routes:** `/app/contacts/[id]`, `/app/properties/[id]`
- **Purpose:** Maintain durable relationship and property facts separately from identity text.
- **Audience:** authorized staff
- **Primary action:** Review/update governed record
- **Secondary actions:** Open opportunities, Open projects
- **Server/client boundary:** Merges require reviewed evidence; email alone is not identity.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Contact / Property Detail                                  │
├──────────────────────────────────────────────────────────────┤
│ 01  record header                                            │
├──────────────────────────────────────────────────────────────┤
│ 02  contact/property facts                                   │
├──────────────────────────────────────────────────────────────┤
│ 03  relationships/grants                                     │
├──────────────────────────────────────────────────────────────┤
│ 04  history                                                  │
├──────────────────────────────────────────────────────────────┤
│ 05  opportunities/projects                                   │
├──────────────────────────────────────────────────────────────┤
│ 06  files                                                    │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Contact / Property Detail  │
├────────────────────────────┤
│ 01 header                  │
├────────────────────────────┤
│ 02 facts                   │
├────────────────────────────┤
│ 03 relationships           │
├────────────────────────────┤
│ 04 active records          │
├────────────────────────────┤
│ 05 history                 │
├────────────────────────────┤
│ 06 files                   │
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
- merge-review

## Components

- `RecordHeader`
- `FactList`
- `RelationshipTable`
- `ActivityTimeline`

## Marketing skills already selected

- `revops`
- `analytics`

## Analytics events

- `record_view`
- `record_update`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
