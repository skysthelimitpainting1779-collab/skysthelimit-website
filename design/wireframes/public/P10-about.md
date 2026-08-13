# P10 — About

## Contract

- **Surface:** public
- **Routes:** `/about`
- **Purpose:** Build confidence through owner story, operating principles, and verified facts.
- **Audience:** prospect checking credibility
- **Primary action:** Start a conversation
- **Secondary actions:** View projects, Capabilities
- **Server/client boundary:** Server Component. No invented biography details.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ About                                                      │
├──────────────────────────────────────────────────────────────┤
│ 01  owner hero                                               │
├──────────────────────────────────────────────────────────────┤
│ 02  verified facts                                           │
├──────────────────────────────────────────────────────────────┤
│ 03  story                                                    │
├──────────────────────────────────────────────────────────────┤
│ 04  operating principles                                     │
├──────────────────────────────────────────────────────────────┤
│ 05  work/process photography                                 │
├──────────────────────────────────────────────────────────────┤
│ 06  CTA                                                      │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ About                      │
├────────────────────────────┤
│ 01 owner                   │
├────────────────────────────┤
│ 02 facts                   │
├────────────────────────────┤
│ 03 CTA                     │
├────────────────────────────┤
│ 04 story                   │
├────────────────────────────┤
│ 05 principles              │
├────────────────────────────┤
│ 06 proof                   │
└────────────────────────────┘
```

## Required states

- default
- loading-proof
- no-proof
- form-error
- offline-fallback

## Components

- `OwnerProfile`
- `BusinessFacts`
- `PrincipleList`
- `MediaGallery`

## Marketing skills already selected

- `product-marketing`
- `copywriting`
- `copy-editing`
- `customer-research`
- `image`

## Analytics events

- `about_view`
- `owner_contact_click`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
