# O07 — Estimate Builder

## Contract

- **Surface:** operator
- **Routes:** `/app/estimates/[id]`
- **Purpose:** Create a versioned estimate from approved scope and assumptions.
- **Audience:** owner, estimator
- **Primary action:** Issue estimate version
- **Secondary actions:** Save draft, Preview
- **Server/client boundary:** No AI-decided price or terms.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Estimate Builder                                           │
├──────────────────────────────────────────────────────────────┤
│ 01  estimate header/status                                   │
├──────────────────────────────────────────────────────────────┤
│ 02  scope source                                             │
├──────────────────────────────────────────────────────────────┤
│ 03  line groups                                              │
├──────────────────────────────────────────────────────────────┤
│ 04  assumptions/exclusions                                   │
├──────────────────────────────────────────────────────────────┤
│ 05  totals                                                   │
├──────────────────────────────────────────────────────────────┤
│ 06  preview                                                  │
├──────────────────────────────────────────────────────────────┤
│ 07  version history                                          │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Estimate Builder           │
├────────────────────────────┤
│ 01 header                  │
├────────────────────────────┤
│ 02 scope                   │
├────────────────────────────┤
│ 03 lines                   │
├────────────────────────────┤
│ 04 totals                  │
├────────────────────────────┤
│ 05 preview                 │
├────────────────────────────┤
│ 06 issue                   │
├────────────────────────────┤
│ 07 history                 │
└────────────────────────────┘
```

## Required states

- loading
- empty
- populated
- partial
- error
- permission-denied
- disabled-account
- stale-integration
- reconciliation-required
- draft
- issued
- superseded

## Components

- `EstimateEditor`
- `LineItems`
- `Assumptions`
- `DocumentPreview`
- `VersionHistory`

## Marketing skills already selected

- `pricing`
- `offers`
- `sales-enablement`

## Analytics events

- `estimate_builder_view`
- `estimate_draft_save`
- `estimate_issue`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
