# P15 — Resource Article

## Contract

- **Surface:** public
- **Routes:** `/resources/[slug]`
- **Purpose:** Answer one practical project question with sourced guidance and a contextual next step.
- **Audience:** researching prospect
- **Primary action:** Apply guidance to project
- **Secondary actions:** Related guide, Contact
- **Server/client boundary:** Server Component, published content only.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Resource Article                                           │
├──────────────────────────────────────────────────────────────┤
│ 01  breadcrumb                                               │
├──────────────────────────────────────────────────────────────┤
│ 02  article header                                           │
├──────────────────────────────────────────────────────────────┤
│ 03  summary                                                  │
├──────────────────────────────────────────────────────────────┤
│ 04  structured article                                       │
├──────────────────────────────────────────────────────────────┤
│ 05  checklist/callout                                        │
├──────────────────────────────────────────────────────────────┤
│ 06  related links                                            │
├──────────────────────────────────────────────────────────────┤
│ 07  context CTA                                              │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Resource Article           │
├────────────────────────────┤
│ 01 breadcrumb              │
├────────────────────────────┤
│ 02 summary                 │
├────────────────────────────┤
│ 03 CTA                     │
├────────────────────────────┤
│ 04 article                 │
├────────────────────────────┤
│ 05 checklist               │
├────────────────────────────┤
│ 06 related                 │
└────────────────────────────┘
```

## Required states

- default
- loading-proof
- no-proof
- form-error
- offline-fallback

## Components

- `Article`
- `TableOfContents`
- `Checklist`
- `Alert`
- `RelatedLinks`

## Marketing skills already selected

- `content-strategy`
- `copywriting`
- `copy-editing`
- `ai-seo`
- `schema`

## Analytics events

- `resource_view`
- `resource_cta_click`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
