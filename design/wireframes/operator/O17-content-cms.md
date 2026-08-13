# O17 — Content / CMS

## Contract

- **Surface:** operator
- **Routes:** `/app/content`
- **Purpose:** Create, review, preview, and publish governed content versions.
- **Audience:** owner, content editor
- **Primary action:** Publish verified content
- **Secondary actions:** Save draft, Preview
- **Server/client boundary:** Publication authorization and provenance required.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Content / CMS                                              │
├──────────────────────────────────────────────────────────────┤
│ 01  content types                                            │
├──────────────────────────────────────────────────────────────┤
│ 02  content table                                            │
├──────────────────────────────────────────────────────────────┤
│ 03  editor                                                   │
├──────────────────────────────────────────────────────────────┤
│ 04  proof/provenance                                         │
├──────────────────────────────────────────────────────────────┤
│ 05  preview                                                  │
├──────────────────────────────────────────────────────────────┤
│ 06  publication history                                      │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Content / CMS              │
├────────────────────────────┤
│ 01 types                   │
├────────────────────────────┤
│ 02 drafts                  │
├────────────────────────────┤
│ 03 editor                  │
├────────────────────────────┤
│ 04 proof                   │
├────────────────────────────┤
│ 05 preview                 │
├────────────────────────────┤
│ 06 publish                 │
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
- draft
- review-required
- published
- archived

## Components

- `ContentTable`
- `Editor`
- `ProvenancePanel`
- `PreviewPanel`
- `VersionHistory`

## Marketing skills already selected

- `content-strategy`
- `copywriting`
- `copy-editing`
- `seo-audit`
- `ai-seo`

## Analytics events

- `content_view`
- `content_preview`
- `content_publish`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
