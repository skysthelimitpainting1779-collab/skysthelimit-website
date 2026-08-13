# O16 — Integration Health

## Contract

- **Surface:** operator
- **Routes:** `/app/integrations`
- **Purpose:** Inventory Vercel-connected resources, provider state, webhooks, and reconciliation health.
- **Audience:** owner, technical operator
- **Primary action:** Resolve connection health
- **Secondary actions:** Test preview connection, View event receipts
- **Server/client boundary:** Never reveal secret values.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Integration Health                                         │
├──────────────────────────────────────────────────────────────┤
│ 01  environment selector                                     │
├──────────────────────────────────────────────────────────────┤
│ 02  integration cards                                        │
├──────────────────────────────────────────────────────────────┤
│ 03  webhook receipts                                         │
├──────────────────────────────────────────────────────────────┤
│ 04  errors                                                   │
├──────────────────────────────────────────────────────────────┤
│ 05  environment variables metadata                           │
├──────────────────────────────────────────────────────────────┤
│ 06  runbook                                                  │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Integration Health         │
├────────────────────────────┤
│ 01 environment             │
├────────────────────────────┤
│ 02 errors                  │
├────────────────────────────┤
│ 03 integrations            │
├────────────────────────────┤
│ 04 receipts                │
├────────────────────────────┤
│ 05 runbook                 │
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
- disconnected
- degraded
- credential-expiring

## Components

- `IntegrationHealthCard`
- `EnvironmentBadge`
- `WebhookReceiptTable`
- `Runbook`

## Marketing skills already selected

- `analytics`
- `revops`

## Analytics events

- `integration_health_view`
- `integration_test`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
