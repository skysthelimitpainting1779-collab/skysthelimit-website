# C05 — Proposal Review

## Contract

- **Surface:** customer
- **Routes:** `/portal/proposals/[id]`
- **Purpose:** Turn an approved scope into a clear decision document.
- **Audience:** project decision-maker
- **Primary action:** Approve proposal
- **Secondary actions:** Ask question, Decline
- **Server/client boundary:** Approval records actor, version, timestamp, and evidence.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Proposal Review                                            │
├──────────────────────────────────────────────────────────────┤
│ 01  proposal header                                          │
├──────────────────────────────────────────────────────────────┤
│ 02  outcome/summary                                          │
├──────────────────────────────────────────────────────────────┤
│ 03  scope                                                    │
├──────────────────────────────────────────────────────────────┤
│ 04  schedule                                                 │
├──────────────────────────────────────────────────────────────┤
│ 05  investment                                               │
├──────────────────────────────────────────────────────────────┤
│ 06  terms                                                    │
├──────────────────────────────────────────────────────────────┤
│ 07  proof                                                    │
├──────────────────────────────────────────────────────────────┤
│ 08  actions                                                  │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Proposal Review            │
├────────────────────────────┤
│ 01 summary                 │
├────────────────────────────┤
│ 02 investment              │
├────────────────────────────┤
│ 03 action                  │
├────────────────────────────┤
│ 04 scope                   │
├────────────────────────────┤
│ 05 schedule                │
├────────────────────────────┤
│ 06 terms                   │
├────────────────────────────┤
│ 07 proof                   │
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
- expired
- superseded

## Components

- `DocumentSurface`
- `ProposalSummary`
- `ApprovalActions`
- `ProofStamp`

## Marketing skills already selected

- `offers`
- `sales-enablement`
- `copywriting`
- `marketing-psychology`

## Analytics events

- `proposal_view`
- `proposal_approve`
- `proposal_decline`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
