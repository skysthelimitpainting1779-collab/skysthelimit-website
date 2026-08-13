# Route Inventory

| Route | Surface | Template | Status | Primary action |
|---|---|---|---|---|
| `/` | public | `P01` | current-redesign | Check project range |
| `/residential` | public | `P02` | current-redesign | Start residential scope |
| `/commercial` | public | `P02` | current-redesign | Request property scope review |
| `/public-sector` | public | `P02` | current-redesign | Review capability fit |
| `/painting-services/[slug]` | public | `P03` | current-redesign | Check service fit |
| `/service-area` | public | `P04` | current-redesign | Find coverage |
| `/service-areas/[slug]` | public | `P05` | current-redesign | Request local estimate |
| `/projects` | public | `P06` | current-redesign | View verified work |
| `/projects/[slug]` | public | `P07` | target | Request similar scope |
| `/estimate` | public | `P08` | current-redesign | Submit scope |
| `/contact` | public | `P09` | current-redesign | Contact Anthony |
| `/about` | public | `P10` | current-redesign | Start a conversation |
| `/capabilities` | public | `P11` | current-redesign | Request capability conversation |
| `/refer` | public | `P12` | current-redesign | Create referral code |
| `/review` | public | `P13` | current-policy-fix | Share honest feedback |
| `/resources` | public | `P14` | target | Choose a guide |
| `/resources/[slug]` | public | `P15` | target | Apply guide to project |
| `/portal/login` | public | `P16` | current-migrate | Sign in or accept invite |
| `/privacy` | public | `P17` | target | Understand data use |
| `/terms` | public | `P17` | target | Review terms |
| `/404` | public | `P18` | current-redesign | Return to a valid path |
| `/error` | public | `P18` | target | Retry or contact |
| `/portal` | customer | `C01` | target | Open next action |
| `/portal/projects/[id]` | customer | `C02` | target | Review project status |
| `/portal/appointments/[id]` | customer | `C03` | target | Confirm or reschedule |
| `/portal/estimates/[id]` | customer | `C04` | target | Review estimate |
| `/portal/proposals/[id]` | customer | `C05` | target | Approve proposal |
| `/portal/agreements/[id]` | customer | `C06` | target | Sign agreement |
| `/portal/payments/[id]` | customer | `C07` | target | Complete test/live-gated payment |
| `/portal/files` | customer | `C08` | target | Open authorized file |
| `/portal/change-orders/[id]` | customer | `C09` | target | Approve or decline change |
| `/portal/messages` | customer | `C10` | target | Read or send update |
| `/portal/settings` | customer | `C11` | target | Manage account |
| `/app` | operator | `O01` | target | Open highest-priority item |
| `/app/leads` | operator | `O02` | target | Qualify lead |
| `/app/pipeline` | operator | `O03` | target | Move opportunity |
| `/app/opportunities/[id]` | operator | `O04` | target | Complete next action |
| `/app/contacts/[id]` | operator | `O05` | target | Review relationship |
| `/app/properties/[id]` | operator | `O05` | target | Review property |
| `/app/calendar` | operator | `O06` | target | Schedule appointment |
| `/app/estimates/[id]` | operator | `O07` | target | Issue estimate version |
| `/app/proposals/[id]` | operator | `O08` | target | Send proposal |
| `/app/revenue` | operator | `O09` | target | Resolve agreement/payment state |
| `/app/projects/[id]` | operator | `O10` | target | Advance project |
| `/app/crews` | operator | `O11` | target | Assign work |
| `/app/files` | operator | `O12` | target | Manage authorized document |
| `/app/change-orders` | operator | `O13` | target | Resolve change |
| `/app/tasks` | operator | `O14` | target | Complete due action |
| `/app/automations` | operator | `O15` | target | Inspect workflow |
| `/app/integrations` | operator | `O16` | target | Resolve connection health |
| `/app/content` | operator | `O17` | target | Publish verified content |
| `/app/growth` | operator | `O18` | target | Review SEO/GBP action |
| `/app/reputation` | operator | `O19` | target | Resolve review/referral item |
| `/app/analytics` | operator | `O20` | target | Review revenue facts |
| `/app/users` | operator | `O21` | target | Manage invitation or role |
| `/app/settings` | operator | `O22` | target | Update governed setting |
| `/manage` | legacy | `LEGACY` | disable-and-redirect | None |
| `/admin` | legacy | `LEGACY` | migration-only | None |
