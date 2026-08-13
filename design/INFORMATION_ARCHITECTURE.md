# Information Architecture

## Public

```text
Home
├── Residential
│   └── Painting service detail
├── Commercial
│   └── Painting service detail
├── Public Sector
│   └── Capabilities
├── Projects
│   └── Project detail
├── Service Areas
│   └── Location detail
├── Resources
│   └── Resource article
├── About
├── Contact
├── Estimate
├── Referral
├── Review
└── Customer sign-in
```

## Customer

```text
Portal overview
├── Project
│   ├── Appointment
│   ├── Estimate
│   ├── Proposal
│   ├── Agreement
│   ├── Payment
│   ├── Files
│   ├── Change order
│   └── Updates
└── Account
```

## Operator

```text
Overview
├── Leads
├── Pipeline
│   └── Opportunity
├── Contacts / Properties
├── Calendar
├── Estimates
├── Proposals
├── Revenue
├── Projects
│   ├── Crew assignments
│   ├── Files
│   └── Change orders
├── Tasks
├── Automations
├── Integrations
├── Content
├── Growth / SEO / GBP
├── Reputation / Referrals
├── Analytics
├── Users
└── Settings
```

## Linking rules

- Every service page links to its market, related services, appropriate service areas, proof, and estimate action.
- Every location page links to relevant services and real nearby project proof when available.
- Every project detail links to its service and location only when the project data supports it.
- Resource articles link to a practical next step, not a generic homepage CTA.
- Portal and operator routes are excluded from public crawl surfaces.
- Legacy routes never appear in navigation.
