---
name: calendar-webhook-sync
description: Use when implementing appointment availability, booking, rescheduling, cancellation, Cal.com integration, calendar webhooks, or calendar-to-CRM synchronization.
---

# Calendar and Booking Synchronization

Use current provider documentation through Context7 or official docs.

Store a canonical appointment record with provider IDs, timezone, status, participants, and idempotency key. Verify webhook signatures, deduplicate events, handle reschedule/cancel ordering, and reconcile provider state. Do not treat a client redirect as booking confirmation. Test timezone, duplicate, cancellation, and stale-event cases.
