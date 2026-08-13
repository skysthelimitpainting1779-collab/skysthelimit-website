# C08 — Customer Files

## Contract

- **Surface:** customer
- **Routes:** `/portal/files`
- **Purpose:** List only files the customer is authorized to access.
- **Audience:** project customer
- **Primary action:** Open authorized file
- **Secondary actions:** Upload requested file
- **Server/client boundary:** Short-lived authorized transfer after project grant.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Customer Files                                             │
├──────────────────────────────────────────────────────────────┤
│ 01  file categories                                          │
├──────────────────────────────────────────────────────────────┤
│ 02  file list                                                │
├──────────────────────────────────────────────────────────────┤
│ 03  upload request                                           │
├──────────────────────────────────────────────────────────────┤
│ 04  privacy/retention details                                │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Customer Files             │
├────────────────────────────┤
│ 01 categories              │
├────────────────────────────┤
│ 02 requested action        │
├────────────────────────────┤
│ 03 files                   │
├────────────────────────────┤
│ 04 privacy                 │
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
- uploading
- scan-pending
- expired

## Components

- `FileTable`
- `Upload`
- `Badge`
- `Alert`
- `Empty`

## Marketing skills already selected

- `onboarding`

## Analytics events

- `files_view`
- `file_download`
- `file_upload`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
