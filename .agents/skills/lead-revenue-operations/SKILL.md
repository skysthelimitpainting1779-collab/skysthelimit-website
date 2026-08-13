---
name: lead-revenue-operations
description: Use when implementing lead intake, qualification, assignment, SLA, estimates, proposals, agreements, deposits, CRM stages, or visitor-to-paid-client workflows.
---

# Lead and Revenue Operations

One typed intake contract feeds one canonical lead command. Persist before effects. Use stable IDs and idempotency keys.

Revenue stages must be explicit and auditable: lead, qualified, appointment, estimate, proposal, agreement, deposit, project. Pricing, terms, and payment amounts are deterministic approved data. External notifications and CRM sync are replayable effects. Test every failure boundary and duplicate transition.
