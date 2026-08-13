# P06 — Projects Index

## Contract

- **Surface:** public
- **Routes:** `/projects`
- **Purpose:** Present verified work as evidence and allow filtering by market/service/location.
- **Audience:** all prospects
- **Primary action:** View verified work
- **Secondary actions:** Request similar scope
- **Server/client boundary:** Server-render initial projects; client filter island uses published DTOs.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Projects Index                                             │
├──────────────────────────────────────────────────────────────┤
│ 01  projects hero                                            │
├──────────────────────────────────────────────────────────────┤
│ 02  filter controls                                          │
├──────────────────────────────────────────────────────────────┤
│ 03  featured project                                         │
├──────────────────────────────────────────────────────────────┤
│ 04  project grid                                             │
├──────────────────────────────────────────────────────────────┤
│ 05  proof policy                                             │
├──────────────────────────────────────────────────────────────┤
│ 06  CTA                                                      │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Projects Index             │
├────────────────────────────┤
│ 01 hero                    │
├────────────────────────────┤
│ 02 featured                │
├────────────────────────────┤
│ 03 filters                 │
├────────────────────────────┤
│ 04 grid                    │
├────────────────────────────┤
│ 05 CTA                     │
└────────────────────────────┘
```

## Required states

- default
- loading-proof
- no-proof
- form-error
- offline-fallback
- empty-filter

## Components

- `ProjectFilter`
- `ProjectEvidenceCard`
- `Empty`
- `Badge`

## Marketing skills already selected

- `cro`
- `copywriting`
- `customer-research`
- `image`
- `video`

## Analytics events

- `projects_view`
- `project_filter`
- `project_open`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
