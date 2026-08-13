# C06 — Agreement Signature

## Contract

- **Surface:** customer
- **Routes:** `/portal/agreements/[id]`
- **Purpose:** Provide clear agreement review and evidence-backed signature.
- **Audience:** authorized signer
- **Primary action:** Sign agreement
- **Secondary actions:** Download, Ask question
- **Server/client boundary:** Signature implementation requires legal and evidence review.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Agreement Signature                                        │
├──────────────────────────────────────────────────────────────┤
│ 01  agreement status                                         │
├──────────────────────────────────────────────────────────────┤
│ 02  document                                                 │
├──────────────────────────────────────────────────────────────┤
│ 03  required acknowledgements                                │
├──────────────────────────────────────────────────────────────┤
│ 04  signature action                                         │
├──────────────────────────────────────────────────────────────┤
│ 05  evidence/receipt                                         │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Agreement Signature        │
├────────────────────────────┤
│ 01 status                  │
├────────────────────────────┤
│ 02 summary                 │
├────────────────────────────┤
│ 03 signature action        │
├────────────────────────────┤
│ 04 document                │
├────────────────────────────┤
│ 05 receipt                 │
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
- signed
- void
- expired

## Components

- `DocumentSurface`
- `Checkbox`
- `SignatureAction`
- `Receipt`

## Marketing skills already selected

- `copy-editing`
- `onboarding`

## Analytics events

- `agreement_view`
- `agreement_sign`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
