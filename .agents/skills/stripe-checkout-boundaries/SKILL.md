---
name: stripe-checkout-boundaries
description: Use when implementing or reviewing Stripe Checkout, deposits, invoices, payment webhooks, refunds, payment state, or go-live boundaries.
---

# Stripe Checkout Boundaries

Load `stripe-best-practices` and current Stripe docs.

Use hosted Checkout Sessions for one-time deposits. Create sessions only from server-authorized deterministic amounts and terms. Verify raw-body webhook signatures, deduplicate event IDs, reconcile out-of-order events, and map Stripe IDs to canonical Convex records. Test mode is allowed; live charges, refunds, and promotion require explicit approval.
