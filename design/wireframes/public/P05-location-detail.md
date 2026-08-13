# P05 — Location Detail

## Contract

- **Surface:** public
- **Routes:** `/service-areas/[slug]`
- **Purpose:** Connect local relevance to real scope and proof without doorway-page duplication.
- **Audience:** prospect in a named location
- **Primary action:** Request local estimate
- **Secondary actions:** View nearby work
- **Server/client boundary:** Server Component; local proof appears only when a verified project/location relationship exists.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Location Detail                                            │
├──────────────────────────────────────────────────────────────┤
│ 01  breadcrumb + local hero                                  │
├──────────────────────────────────────────────────────────────┤
│ 02  coverage facts                                           │
├──────────────────────────────────────────────────────────────┤
│ 03  relevant services                                        │
├──────────────────────────────────────────────────────────────┤
│ 04  nearby proof                                             │
├──────────────────────────────────────────────────────────────┤
│ 05  process                                                  │
├──────────────────────────────────────────────────────────────┤
│ 06  local FAQs                                               │
├──────────────────────────────────────────────────────────────┤
│ 07  CTA                                                      │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Location Detail            │
├────────────────────────────┤
│ 01 breadcrumb              │
├────────────────────────────┤
│ 02 hero                    │
├────────────────────────────┤
│ 03 CTA                     │
├────────────────────────────┤
│ 04 services                │
├────────────────────────────┤
│ 05 proof                   │
├────────────────────────────┤
│ 06 process                 │
├────────────────────────────┤
│ 07 FAQ                     │
└────────────────────────────┘
```

## Required states

- default
- loading-proof
- no-proof
- form-error
- offline-fallback

## Components

- `LocationHero`
- `CoverageFacts`
- `ServiceLinks`
- `ProjectEvidenceCard`
- `Accordion`

## Marketing skills already selected

- `programmatic-seo`
- `ai-seo`
- `schema`
- `seo-audit`
- `copywriting`

## Analytics events

- `location_view`
- `local_estimate_start`
- `nearby_project_open`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
