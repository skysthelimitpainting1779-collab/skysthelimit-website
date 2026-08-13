# O18 — SEO / GBP Workspace

## Contract

- **Surface:** operator
- **Routes:** `/app/growth`
- **Purpose:** Manage route health, local proof, content opportunities, and approval-gated GBP actions.
- **Audience:** owner, growth operator
- **Primary action:** Review growth action
- **Secondary actions:** Open route issue, Prepare GBP change
- **Server/client boundary:** GBP mutation remains explicit approval.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ SEO / GBP Workspace                                        │
├──────────────────────────────────────────────────────────────┤
│ 01  growth summary                                           │
├──────────────────────────────────────────────────────────────┤
│ 02  route/crawl health                                       │
├──────────────────────────────────────────────────────────────┤
│ 03  local proof gaps                                         │
├──────────────────────────────────────────────────────────────┤
│ 04  content opportunities                                    │
├──────────────────────────────────────────────────────────────┤
│ 05  GBP draft queue                                          │
├──────────────────────────────────────────────────────────────┤
│ 06  experiments                                              │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ SEO / GBP Workspace        │
├────────────────────────────┤
│ 01 summary                 │
├────────────────────────────┤
│ 02 issues                  │
├────────────────────────────┤
│ 03 proof gaps              │
├────────────────────────────┤
│ 04 opportunities           │
├────────────────────────────┤
│ 05 GBP drafts              │
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
- approval-required

## Components

- `MetricCard`
- `RouteHealthTable`
- `ProofGap`
- `DraftQueue`
- `ExperimentCard`

## Marketing skills already selected

- `seo-audit`
- `ai-seo`
- `programmatic-seo`
- `schema`
- `content-strategy`

## Analytics events

- `growth_workspace_view`
- `route_issue_open`
- `gbp_draft_prepare`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
