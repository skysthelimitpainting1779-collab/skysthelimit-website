# O15 — Automation Center

## Contract

- **Surface:** operator
- **Routes:** `/app/automations`
- **Purpose:** Show workflow definitions, runs, failures, retries, and manual approval hooks.
- **Audience:** owner, authorized operator
- **Primary action:** Inspect workflow
- **Secondary actions:** Retry allowed step, Pause automation
- **Server/client boundary:** Permissions and idempotency verified before retry.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Automation Center                                          │
├──────────────────────────────────────────────────────────────┤
│ 01  workflow health                                          │
├──────────────────────────────────────────────────────────────┤
│ 02  definitions                                              │
├──────────────────────────────────────────────────────────────┤
│ 03  run history                                              │
├──────────────────────────────────────────────────────────────┤
│ 04  failure queue                                            │
├──────────────────────────────────────────────────────────────┤
│ 05  detail trace                                             │
├──────────────────────────────────────────────────────────────┤
│ 06  approval hooks                                           │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Automation Center          │
├────────────────────────────┤
│ 01 health                  │
├────────────────────────────┤
│ 02 failures                │
├────────────────────────────┤
│ 03 workflows               │
├────────────────────────────┤
│ 04 run detail              │
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
- paused
- retrying
- approval-required

## Components

- `WorkflowTable`
- `RunTimeline`
- `Alert`
- `ApprovalPanel`

## Marketing skills already selected

- `marketing-loops`
- `revops`

## Analytics events

- `automation_view`
- `workflow_retry`
- `workflow_pause`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
