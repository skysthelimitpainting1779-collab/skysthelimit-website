# P08 — Estimate Wizard

## Contract

- **Surface:** public
- **Routes:** `/estimate`
- **Purpose:** Collect a qualified scope with minimum friction and provide an honest planning range.
- **Audience:** ready prospect
- **Primary action:** Submit scope
- **Secondary actions:** Save/resume, Call
- **Server/client boundary:** Client wizard backed by server/Convex mutations. Browser stores only opaque resume token.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Estimate Wizard                                            │
├──────────────────────────────────────────────────────────────┤
│ 01  progress header                                          │
├──────────────────────────────────────────────────────────────┤
│ 02  question region                                          │
├──────────────────────────────────────────────────────────────┤
│ 03  context/help rail                                        │
├──────────────────────────────────────────────────────────────┤
│ 04  range summary                                            │
├──────────────────────────────────────────────────────────────┤
│ 05  contact/files                                            │
├──────────────────────────────────────────────────────────────┤
│ 06  privacy/next step                                        │
├──────────────────────────────────────────────────────────────┤
│ 07  confirmation                                             │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Estimate Wizard            │
├────────────────────────────┤
│ 01 progress                │
├────────────────────────────┤
│ 02 question                │
├────────────────────────────┤
│ 03 help                    │
├────────────────────────────┤
│ 04 range                   │
├────────────────────────────┤
│ 05 contact                 │
├────────────────────────────┤
│ 06 files                   │
├────────────────────────────┤
│ 07 submit                  │
├────────────────────────────┤
│ 08 confirmation            │
└────────────────────────────┘
```

## Required states

- start
- step-valid
- step-invalid
- uploading
- saved-draft
- submitting
- saved-delivery-pending
- success
- delivery-error
- offline

## Components

- `Progress`
- `FieldGroup`
- `ToggleGroup`
- `Input`
- `Upload`
- `PlanningRange`
- `Alert`
- `NextActionPanel`

## Marketing skills already selected

- `cro`
- `copywriting`
- `marketing-psychology`
- `offers`
- `analytics`
- `revops`

## Analytics events

- `estimate_start`
- `estimate_step_complete`
- `range_view`
- `upload_complete`
- `lead_saved`
- `lead_delivery_state`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
