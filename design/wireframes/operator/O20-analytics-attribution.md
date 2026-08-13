# O20 — Analytics / Attribution

## Contract

- **Surface:** operator
- **Routes:** `/app/analytics`
- **Purpose:** Connect acquisition and experience events to canonical leads, opportunities, projects, and payments.
- **Audience:** owner, growth/finance operator
- **Primary action:** Review revenue facts
- **Secondary actions:** Inspect funnel, Inspect experiment
- **Server/client boundary:** Server facts, no PII in analytics payloads.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Analytics / Attribution                                    │
├──────────────────────────────────────────────────────────────┤
│ 01  date/filter bar                                          │
├──────────────────────────────────────────────────────────────┤
│ 02  revenue facts                                            │
├──────────────────────────────────────────────────────────────┤
│ 03  funnel                                                   │
├──────────────────────────────────────────────────────────────┤
│ 04  source attribution                                       │
├──────────────────────────────────────────────────────────────┤
│ 05  experiments                                              │
├──────────────────────────────────────────────────────────────┤
│ 06  data quality/reconciliation                              │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Analytics / Attribution    │
├────────────────────────────┤
│ 01 date                    │
├────────────────────────────┤
│ 02 revenue                 │
├────────────────────────────┤
│ 03 funnel                  │
├────────────────────────────┤
│ 04 sources                 │
├────────────────────────────┤
│ 05 quality                 │
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
- data-lag
- reconciliation-mismatch

## Components

- `MetricCard`
- `FunnelChart`
- `AttributionTable`
- `ExperimentTable`
- `DataQuality`

## Marketing skills already selected

- `analytics`
- `ab-testing`
- `revops`

## Analytics events

- `analytics_view`
- `funnel_drilldown`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
