---
name: customer-portal-isolation
description: Use when implementing customer portals, operator cockpits, project views, authorized DTOs, resource grants, assignments, change orders, or tenant isolation.
---

# Customer Portal Isolation

All data access is server-authorized through explicit resource grants. Clients receive minimal DTOs and never unrestricted database clients.

Test anonymous, wrong customer, wrong company, wrong property, wrong project, disabled user, staff role, and owner role. Keep operator and customer route groups separate. Every mutation records actor, target, before/after facts, and resulting domain event.
