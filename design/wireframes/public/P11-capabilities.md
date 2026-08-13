# P11 — Capabilities

## Contract

- **Surface:** public
- **Routes:** `/capabilities`
- **Purpose:** Give commercial, facility, prime, and agency buyers a concise qualification view.
- **Audience:** property manager, facility buyer, prime, agency
- **Primary action:** Request capability conversation
- **Secondary actions:** Download capability sheet, Contact
- **Server/client boundary:** Server Component; downloads use governed public documents only.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Capabilities                                               │
├──────────────────────────────────────────────────────────────┤
│ 01  capability hero                                          │
├──────────────────────────────────────────────────────────────┤
│ 02  business facts                                           │
├──────────────────────────────────────────────────────────────┤
│ 03  markets/scope                                            │
├──────────────────────────────────────────────────────────────┤
│ 04  documentation status                                     │
├──────────────────────────────────────────────────────────────┤
│ 05  process/closeout                                         │
├──────────────────────────────────────────────────────────────┤
│ 06  project proof                                            │
├──────────────────────────────────────────────────────────────┤
│ 07  CTA                                                      │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Capabilities               │
├────────────────────────────┤
│ 01 hero                    │
├────────────────────────────┤
│ 02 facts                   │
├────────────────────────────┤
│ 03 CTA                     │
├────────────────────────────┤
│ 04 scope                   │
├────────────────────────────┤
│ 05 documents               │
├────────────────────────────┤
│ 06 process                 │
├────────────────────────────┤
│ 07 proof                   │
└────────────────────────────┘
```

## Required states

- default
- loading-proof
- no-proof
- form-error
- offline-fallback
- document-unavailable

## Components

- `CapabilityFacts`
- `ScopeMatrix`
- `DocumentList`
- `ProjectEvidenceCard`
- `Button`

## Marketing skills already selected

- `sales-enablement`
- `copywriting`
- `offers`
- `schema`
- `analytics`

## Analytics events

- `capabilities_view`
- `capability_download`
- `capability_contact`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
