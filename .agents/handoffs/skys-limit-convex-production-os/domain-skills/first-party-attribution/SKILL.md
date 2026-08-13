---
name: first-party-attribution
description: Use when implementing analytics events, attribution, revenue dashboards, experiments, funnels, UTM handling, referral measurement, or metric reconciliation.
---

# First-Party Attribution

Use internal entity IDs, not raw PII. Store event schema version, anonymous/session ID, lead/opportunity/project/payment IDs, source facts, and server timestamp.

Revenue is reconciled from canonical payments and opportunities, never browser claims. Experiment assignment is deterministic, recorded, and excluded from high-risk financial or authorization decisions. Test duplicate events, missing attribution, cross-device merge rules, and dashboard reconciliation.
