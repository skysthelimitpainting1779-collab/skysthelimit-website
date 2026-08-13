# P12 — Referral

## Contract

- **Surface:** public
- **Routes:** `/refer`
- **Purpose:** Create an opaque referral link and explain verified terms without exposing PII.
- **Audience:** past customer, partner
- **Primary action:** Create referral code
- **Secondary actions:** Share, Review terms
- **Server/client boundary:** Client form backed by server-issued signed code; no email in URL or analytics.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Referral                                                   │
├──────────────────────────────────────────────────────────────┤
│ 01  referral hero                                            │
├──────────────────────────────────────────────────────────────┤
│ 02  terms                                                    │
├──────────────────────────────────────────────────────────────┤
│ 03  identity confirmation                                    │
├──────────────────────────────────────────────────────────────┤
│ 04  code/link result                                         │
├──────────────────────────────────────────────────────────────┤
│ 05  share controls                                           │
├──────────────────────────────────────────────────────────────┤
│ 06  status                                                   │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Referral                   │
├────────────────────────────┤
│ 01 hero                    │
├────────────────────────────┤
│ 02 terms                   │
├────────────────────────────┤
│ 03 confirm                 │
├────────────────────────────┤
│ 04 generate                │
├────────────────────────────┤
│ 05 share                   │
├────────────────────────────┤
│ 06 status                  │
└────────────────────────────┘
```

## Required states

- start
- validating
- generated
- copied
- invalid
- revoked
- credited

## Components

- `FieldGroup`
- `ReferralCode`
- `ShareActions`
- `Alert`
- `StatusTimeline`

## Marketing skills already selected

- `referrals`
- `cro`
- `copywriting`
- `analytics`

## Analytics events

- `referral_start`
- `referral_code_created`
- `referral_share`
- `referral_attributed`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
