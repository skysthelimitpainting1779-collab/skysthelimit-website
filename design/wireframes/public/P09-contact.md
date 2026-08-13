# P09 — Contact

## Contract

- **Surface:** public
- **Routes:** `/contact`
- **Purpose:** Offer direct contact and a short qualified alternative to the estimate wizard.
- **Audience:** prospect needing direct help
- **Primary action:** Contact Anthony
- **Secondary actions:** Open estimate, Call, Text
- **Server/client boundary:** Server page with client form island.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Contact                                                    │
├──────────────────────────────────────────────────────────────┤
│ 01  contact hero                                             │
├──────────────────────────────────────────────────────────────┤
│ 02  channel choices                                          │
├──────────────────────────────────────────────────────────────┤
│ 03  short form                                               │
├──────────────────────────────────────────────────────────────┤
│ 04  response expectations                                    │
├──────────────────────────────────────────────────────────────┤
│ 05  service/coverage links                                   │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Contact                    │
├────────────────────────────┤
│ 01 hero                    │
├────────────────────────────┤
│ 02 call/text               │
├────────────────────────────┤
│ 03 short form              │
├────────────────────────────┤
│ 04 expectations            │
├────────────────────────────┤
│ 05 links                   │
└────────────────────────────┘
```

## Required states

- default
- loading-proof
- no-proof
- form-error
- offline-fallback

## Components

- `ContactChannels`
- `FieldGroup`
- `Alert`
- `BusinessFacts`

## Marketing skills already selected

- `cro`
- `copywriting`
- `revops`
- `analytics`

## Analytics events

- `contact_view`
- `call_click`
- `text_click`
- `contact_submit`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
