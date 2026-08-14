---
trigger: always_on
description: Convex backend platform engineering rules and mutation safety guards.
---

# Convex Platform Rules

1. All mutations, queries, and actions must define explicit argument and return validators (`v.object(...)`).
2. Implement auth helpers for RBAC and tenant resource ownership verification.
3. Production database migrations and mutations require explicit manual approval gate; direct autonomous production mutation is hard-denied.
