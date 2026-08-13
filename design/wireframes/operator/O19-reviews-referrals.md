# O19 — Reviews / Referrals

## Contract

- **Surface:** operator
- **Routes:** `/app/reputation`
- **Purpose:** Track honest review invitations, support cases, referral codes, and attribution.
- **Audience:** owner, authorized staff
- **Primary action:** Resolve reputation item
- **Secondary actions:** Open support case, Review referral
- **Server/client boundary:** No rating-based review gating.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Reviews / Referrals                                        │
├──────────────────────────────────────────────────────────────┤
│ 01  reputation summary                                       │
├──────────────────────────────────────────────────────────────┤
│ 02  review events                                            │
├──────────────────────────────────────────────────────────────┤
│ 03  support queue                                            │
├──────────────────────────────────────────────────────────────┤
│ 04  referrals                                                │
├──────────────────────────────────────────────────────────────┤
│ 05  exceptions                                               │
├──────────────────────────────────────────────────────────────┤
│ 06  policy status                                            │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Reviews / Referrals        │
├────────────────────────────┤
│ 01 summary                 │
├────────────────────────────┤
│ 02 support                 │
├────────────────────────────┤
│ 03 reviews                 │
├────────────────────────────┤
│ 04 referrals               │
├────────────────────────────┤
│ 05 exceptions              │
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

## Components

- `MetricCard`
- `ReviewEventTable`
- `SupportQueue`
- `ReferralTable`
- `PolicyAlert`

## Marketing skills already selected

- `referrals`
- `customer-research`
- `analytics`

## Analytics events

- `reputation_view`
- `support_case_open`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
