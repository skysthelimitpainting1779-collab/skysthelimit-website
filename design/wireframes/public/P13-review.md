# P13 — Review

## Contract

- **Surface:** public
- **Routes:** `/review`
- **Purpose:** Offer the same honest public-review path to every customer while providing an independent support route.
- **Audience:** completed customer
- **Primary action:** Leave honest review
- **Secondary actions:** Request help, Contact
- **Server/client boundary:** Public path is equal regardless of rating; support is a separate choice.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Review                                                     │
├──────────────────────────────────────────────────────────────┤
│ 01  review hero                                              │
├──────────────────────────────────────────────────────────────┤
│ 02  public review action                                     │
├──────────────────────────────────────────────────────────────┤
│ 03  private support action                                   │
├──────────────────────────────────────────────────────────────┤
│ 04  expectations                                             │
├──────────────────────────────────────────────────────────────┤
│ 05  confirmation                                             │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Review                     │
├────────────────────────────┤
│ 01 hero                    │
├────────────────────────────┤
│ 02 public review           │
├────────────────────────────┤
│ 03 support                 │
├────────────────────────────┤
│ 04 confirmation            │
└────────────────────────────┘
```

## Required states

- default
- review-clicked
- support-form
- support-submitted
- error

## Components

- `Button`
- `Alert`
- `FieldGroup`
- `NextActionPanel`

## Marketing skills already selected

- `cro`
- `copywriting`
- `customer-research`
- `analytics`

## Analytics events

- `review_page_view`
- `public_review_click`
- `support_request_submit`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
