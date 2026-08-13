# O12 — Files / Vault

## Contract

- **Surface:** operator
- **Routes:** `/app/files`
- **Purpose:** Manage business, project, and public media files with privacy classes and retention.
- **Audience:** owner, authorized staff
- **Primary action:** Manage authorized document
- **Secondary actions:** Upload, Publish approved media
- **Server/client boundary:** Public publication is explicit and reviewed.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Files / Vault                                              │
├──────────────────────────────────────────────────────────────┤
│ 01  privacy-class filters                                    │
├──────────────────────────────────────────────────────────────┤
│ 02  file table                                               │
├──────────────────────────────────────────────────────────────┤
│ 03  upload                                                   │
├──────────────────────────────────────────────────────────────┤
│ 04  scan/retention status                                    │
├──────────────────────────────────────────────────────────────┤
│ 05  linked records                                           │
├──────────────────────────────────────────────────────────────┤
│ 06  publication control                                      │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Files / Vault              │
├────────────────────────────┤
│ 01 filters                 │
├────────────────────────────┤
│ 02 upload                  │
├────────────────────────────┤
│ 03 files                   │
├────────────────────────────┤
│ 04 status                  │
├────────────────────────────┤
│ 05 links                   │
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
- scan-pending
- quarantined
- retention-due

## Components

- `FileTable`
- `Upload`
- `PrivacyBadge`
- `PublicationControl`
- `Alert`

## Marketing skills already selected

- `image`
- `sales-enablement`

## Analytics events

- `file_vault_view`
- `file_upload`
- `file_publish`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
