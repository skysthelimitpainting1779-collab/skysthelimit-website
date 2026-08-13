# O08 — Proposal Builder

## Contract

- **Surface:** operator
- **Routes:** `/app/proposals/[id]`
- **Purpose:** Assemble an approved estimate into a proof-backed decision document.
- **Audience:** owner, sales staff
- **Primary action:** Send proposal
- **Secondary actions:** Preview, Save draft
- **Server/client boundary:** Every proof block points to verified content.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Proposal Builder                                           │
├──────────────────────────────────────────────────────────────┤
│ 01  proposal header                                          │
├──────────────────────────────────────────────────────────────┤
│ 02  selected estimate                                        │
├──────────────────────────────────────────────────────────────┤
│ 03  summary/outcomes                                         │
├──────────────────────────────────────────────────────────────┤
│ 04  scope/schedule                                           │
├──────────────────────────────────────────────────────────────┤
│ 05  proof                                                    │
├──────────────────────────────────────────────────────────────┤
│ 06  terms                                                    │
├──────────────────────────────────────────────────────────────┤
│ 07  preview                                                  │
├──────────────────────────────────────────────────────────────┤
│ 08  send state                                               │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Proposal Builder           │
├────────────────────────────┤
│ 01 header                  │
├────────────────────────────┤
│ 02 summary                 │
├────────────────────────────┤
│ 03 scope                   │
├────────────────────────────┤
│ 04 investment              │
├────────────────────────────┤
│ 05 proof                   │
├────────────────────────────┤
│ 06 preview                 │
├────────────────────────────┤
│ 07 send                    │
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
- sent
- viewed
- approved
- expired

## Components

- `ProposalEditor`
- `DocumentPreview`
- `ProofPicker`
- `SendPanel`

## Marketing skills already selected

- `sales-enablement`
- `offers`
- `copywriting`
- `emails`

## Analytics events

- `proposal_builder_view`
- `proposal_send`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
