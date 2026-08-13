# P04 — Service Area Hub

## Contract

- **Surface:** public
- **Routes:** `/service-area`
- **Purpose:** Show credible coverage and help visitors find their location path.
- **Audience:** Twin Cities prospect
- **Primary action:** Find local coverage
- **Secondary actions:** Start estimate
- **Server/client boundary:** Server page with optional client search/map island.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Service Area Hub                                           │
├──────────────────────────────────────────────────────────────┤
│ 01  coverage hero                                            │
├──────────────────────────────────────────────────────────────┤
│ 02  map/list                                                 │
├──────────────────────────────────────────────────────────────┤
│ 03  coverage policy                                          │
├──────────────────────────────────────────────────────────────┤
│ 04  featured locations                                       │
├──────────────────────────────────────────────────────────────┤
│ 05  service links                                            │
├──────────────────────────────────────────────────────────────┤
│ 06  CTA                                                      │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Service Area Hub           │
├────────────────────────────┤
│ 01 hero                    │
├────────────────────────────┤
│ 02 search/list             │
├────────────────────────────┤
│ 03 coverage policy         │
├────────────────────────────┤
│ 04 featured                │
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

## Components

- `ServiceAreaMap`
- `Command`
- `LocationCard`
- `Alert`

## Marketing skills already selected

- `site-architecture`
- `programmatic-seo`
- `seo-audit`
- `copywriting`

## Analytics events

- `service_area_view`
- `location_select`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
