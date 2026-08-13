# P17 — Legal / Privacy

## Contract

- **Surface:** public
- **Routes:** `/privacy`, `/terms`
- **Purpose:** Explain data handling and terms in plain language.
- **Audience:** visitor, customer
- **Primary action:** Understand policy
- **Secondary actions:** Contact
- **Server/client boundary:** Server Component; text requires legal review before production.

## Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Legal / Privacy                                            │
├──────────────────────────────────────────────────────────────┤
│ 01  document header                                          │
├──────────────────────────────────────────────────────────────┤
│ 02  last updated                                             │
├──────────────────────────────────────────────────────────────┤
│ 03  table of contents                                        │
├──────────────────────────────────────────────────────────────┤
│ 04  document sections                                        │
├──────────────────────────────────────────────────────────────┤
│ 05  contact                                                  │
└──────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌────────────────────────────┐
│ Legal / Privacy            │
├────────────────────────────┤
│ 01 header                  │
├────────────────────────────┤
│ 02 summary                 │
├────────────────────────────┤
│ 03 contents                │
├────────────────────────────┤
│ 04 document                │
├────────────────────────────┤
│ 05 contact                 │
└────────────────────────────┘
```

## Required states

- default

## Components

- `Article`
- `TableOfContents`

## Marketing skills already selected

- `copy-editing`

## Analytics events

- `legal_view`

## Notes

Implement exactly as specified unless a verified route requirement conflicts.
