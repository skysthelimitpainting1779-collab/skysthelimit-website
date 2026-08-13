# P14 — Resources Index

## Contract

- **Surface:** public
- **Routes:** `/resources`
- **Purpose:** Help prospects make project decisions and create a governed SEO/content hub.
- **Audience:** researching prospect
- **Primary action:** Choose a guide
- **Secondary actions:** Start scope review
- **Server/client boundary:** Server-render published resources; optional client filters.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Resources Index                                            │
├──────────────────────────────────────────────────────────────┤
│ 01  resources hero                                           │
├──────────────────────────────────────────────────────────────┤
│ 02  topic clusters                                           │
├──────────────────────────────────────────────────────────────┤
│ 03  featured guide                                           │
├──────────────────────────────────────────────────────────────┤
│ 04  guide grid                                               │
├──────────────────────────────────────────────────────────────┤
│ 05  CTA                                                      │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Resources Index            │
├────────────────────────────┤
│ 01 hero                    │
├────────────────────────────┤
│ 02 featured                │
├────────────────────────────┤
│ 03 clusters                │
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
- empty-category

## Components

- `ResourceCard`
- `Tabs`
- `Badge`
- `Search`

## Marketing skills already selected

- `content-strategy`
- `ai-seo`
- `seo-audit`
- `lead-magnets`
- `copywriting`

## Analytics events

- `resources_view`
- `resource_filter`
- `resource_open`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
