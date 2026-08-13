# P01 — Homepage

## Contract

- **Surface:** public
- **Routes:** `/`
- **Purpose:** Route visitors into the correct market or estimate path while establishing trust immediately.
- **Audience:** homeowner, property operator, facility buyer
- **Primary action:** Check project range
- **Secondary actions:** Call Anthony, View real projects
- **Server/client boundary:** Server Component page; client islands only for navigation, media controls, analytics, and interactive proof.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Homepage                                                   │
├──────────────────────────────────────────────────────────────┤
│ 01  utility bar + navigation                                 │
├──────────────────────────────────────────────────────────────┤
│ 02  full-bleed proof hero                                    │
├──────────────────────────────────────────────────────────────┤
│ 03  trust facts                                              │
├──────────────────────────────────────────────────────────────┤
│ 04  market selector                                          │
├──────────────────────────────────────────────────────────────┤
│ 05  prep/process story                                       │
├──────────────────────────────────────────────────────────────┤
│ 06  project evidence                                         │
├──────────────────────────────────────────────────────────────┤
│ 07  objection answers                                        │
├──────────────────────────────────────────────────────────────┤
│ 08  service-area proof                                       │
├──────────────────────────────────────────────────────────────┤
│ 09  final CTA                                                │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Homepage                   │
├────────────────────────────┤
│ 01 navigation              │
├────────────────────────────┤
│ 02 hero copy               │
├────────────────────────────┤
│ 03 primary CTA             │
├────────────────────────────┤
│ 04 trust facts             │
├────────────────────────────┤
│ 05 market selector         │
├────────────────────────────┤
│ 06 proof                   │
├────────────────────────────┤
│ 07 process                 │
├────────────────────────────┤
│ 08 FAQ                     │
├────────────────────────────┤
│ 09 sticky call/estimate    │
└────────────────────────────┘
```

## Required states

- default
- loading-proof
- no-proof
- form-error
- offline-fallback

## Components

- `ConversionHeader`
- `Button`
- `ProofStamp`
- `MarketPath`
- `ProjectEvidenceCard`
- `Accordion`
- `ConversionFooter`

## Marketing skills already selected

- `product-marketing`
- `cro`
- `copywriting`
- `marketing-psychology`
- `offers`
- `analytics`

## Analytics events

- `home_view`
- `market_path_select`
- `planning_range_click`
- `call_click`
- `project_proof_open`

## Notes

Do not lead with generic company history.
