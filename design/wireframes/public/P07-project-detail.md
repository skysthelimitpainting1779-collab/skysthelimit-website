# P07 — Project Detail

## Contract

- **Surface:** public
- **Routes:** `/projects/[slug]`
- **Purpose:** Show a source-backed challenge, preparation, execution, and result.
- **Audience:** prospect evaluating evidence
- **Primary action:** Request similar scope
- **Secondary actions:** View related service, View location
- **Server/client boundary:** Server Component; interactive media only as client island. No generated image is project proof.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Project Detail                                             │
├──────────────────────────────────────────────────────────────┤
│ 01  breadcrumb                                               │
├──────────────────────────────────────────────────────────────┤
│ 02  project title/facts                                      │
├──────────────────────────────────────────────────────────────┤
│ 03  before/after media                                       │
├──────────────────────────────────────────────────────────────┤
│ 04  challenge                                                │
├──────────────────────────────────────────────────────────────┤
│ 05  prep                                                     │
├──────────────────────────────────────────────────────────────┤
│ 06  execution                                                │
├──────────────────────────────────────────────────────────────┤
│ 07  result                                                   │
├──────────────────────────────────────────────────────────────┤
│ 08  related proof                                            │
├──────────────────────────────────────────────────────────────┤
│ 09  CTA                                                      │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Project Detail             │
├────────────────────────────┤
│ 01 breadcrumb              │
├────────────────────────────┤
│ 02 facts                   │
├────────────────────────────┤
│ 03 media                   │
├────────────────────────────┤
│ 04 CTA                     │
├────────────────────────────┤
│ 05 challenge               │
├────────────────────────────┤
│ 06 prep                    │
├────────────────────────────┤
│ 07 result                  │
├────────────────────────────┤
│ 08 related                 │
└────────────────────────────┘
```

## Required states

- default
- loading-proof
- no-proof
- form-error
- offline-fallback
- media-unavailable

## Components

- `BeforeAfter`
- `ProofStamp`
- `PreparationChecklist`
- `MediaGallery`
- `JsonLd`

## Marketing skills already selected

- `copywriting`
- `copy-editing`
- `image`
- `video`
- `schema`
- `cro`

## Analytics events

- `project_detail_view`
- `before_after_interact`
- `similar_scope_start`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
