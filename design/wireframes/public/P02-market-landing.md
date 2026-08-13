# P02 — Market Landing

## Contract

- **Surface:** public
- **Routes:** `/residential`, `/commercial`, `/public-sector`
- **Purpose:** Explain fit, constraints, proof, and next step for one market.
- **Audience:** market-specific prospect
- **Primary action:** Start market-specific scope review
- **Secondary actions:** View projects, Call
- **Server/client boundary:** Server Component with evidence and FAQ data from published Convex content.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Market Landing                                             │
├──────────────────────────────────────────────────────────────┤
│ 01  market hero                                              │
├──────────────────────────────────────────────────────────────┤
│ 02  fit/not-fit                                              │
├──────────────────────────────────────────────────────────────┤
│ 03  capability scope                                         │
├──────────────────────────────────────────────────────────────┤
│ 04  preparation/process                                      │
├──────────────────────────────────────────────────────────────┤
│ 05  market proof                                             │
├──────────────────────────────────────────────────────────────┤
│ 06  FAQs                                                     │
├──────────────────────────────────────────────────────────────┤
│ 07  CTA                                                      │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Market Landing             │
├────────────────────────────┤
│ 01 hero                    │
├────────────────────────────┤
│ 02 CTA                     │
├────────────────────────────┤
│ 03 fit                     │
├────────────────────────────┤
│ 04 scope                   │
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

- `MarketHero`
- `ScopeMatrix`
- `PreparationChecklist`
- `ProjectEvidenceCard`
- `Accordion`

## Marketing skills already selected

- `product-marketing`
- `cro`
- `copywriting`
- `offers`
- `sales-enablement`
- `seo-audit`
- `schema`

## Analytics events

- `market_view`
- `market_scope_start`
- `market_project_open`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
