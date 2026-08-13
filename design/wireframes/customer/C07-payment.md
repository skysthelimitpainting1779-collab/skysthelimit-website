# C07 — Payment

## Contract

- **Surface:** customer
- **Routes:** `/portal/payments/[id]`
- **Purpose:** Show payment state and launch a hosted Stripe Checkout session when authorized.
- **Audience:** authorized payer
- **Primary action:** Pay securely
- **Secondary actions:** Download receipt, Contact
- **Server/client boundary:** Test mode until production approval. No card data handled by app.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Payment                                                    │
├──────────────────────────────────────────────────────────────┤
│ 01  payment status                                           │
├──────────────────────────────────────────────────────────────┤
│ 02  amount/source document                                   │
├──────────────────────────────────────────────────────────────┤
│ 03  hosted checkout action                                   │
├──────────────────────────────────────────────────────────────┤
│ 04  history/receipt                                          │
├──────────────────────────────────────────────────────────────┤
│ 05  support                                                  │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Payment                    │
├────────────────────────────┤
│ 01 status                  │
├────────────────────────────┤
│ 02 amount                  │
├────────────────────────────┤
│ 03 action                  │
├────────────────────────────┤
│ 04 receipt                 │
├────────────────────────────┤
│ 05 support                 │
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
- checkout-created
- processing
- paid
- failed
- refunded

## Components

- `PaymentSummary`
- `Button`
- `Receipt`
- `Alert`

## Marketing skills already selected

- `offers`
- `copywriting`
- `analytics`

## Analytics events

- `payment_view`
- `checkout_start`
- `payment_posted`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
