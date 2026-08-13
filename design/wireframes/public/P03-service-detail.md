# P03 — Service Detail

## Contract

- **Surface:** public
- **Routes:** `/painting-services/[slug]`
- **Purpose:** Answer service-specific questions and convert relevant visitors without thin SEO duplication.
- **Audience:** prospect searching for a named service
- **Primary action:** Check service fit
- **Secondary actions:** See related work, Call
- **Server/client boundary:** Server Component. Route registry and published content determine existence.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Service Detail                                             │
├──────────────────────────────────────────────────────────────┤
│ 01  breadcrumb + service hero                                │
├──────────────────────────────────────────────────────────────┤
│ 02  when this service fits                                   │
├──────────────────────────────────────────────────────────────┤
│ 03  scope inclusions                                         │
├──────────────────────────────────────────────────────────────┤
│ 04  prep details                                             │
├──────────────────────────────────────────────────────────────┤
│ 05  proof                                                    │
├──────────────────────────────────────────────────────────────┤
│ 06  related services/areas                                   │
├──────────────────────────────────────────────────────────────┤
│ 07  FAQ                                                      │
├──────────────────────────────────────────────────────────────┤
│ 08  CTA                                                      │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Service Detail             │
├────────────────────────────┤
│ 01 breadcrumb              │
├────────────────────────────┤
│ 02 hero                    │
├────────────────────────────┤
│ 03 CTA                     │
├────────────────────────────┤
│ 04 fit                     │
├────────────────────────────┤
│ 05 scope                   │
├────────────────────────────┤
│ 06 proof                   │
├────────────────────────────┤
│ 07 FAQ                     │
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

## Components

- `Breadcrumb`
- `ServiceHero`
- `ScopeSummary`
- `PreparationChecklist`
- `ProjectEvidenceCard`
- `RelatedLinks`

## Marketing skills already selected

- `copywriting`
- `cro`
- `programmatic-seo`
- `ai-seo`
- `schema`
- `seo-audit`

## Analytics events

- `service_view`
- `service_scope_start`
- `related_service_click`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
