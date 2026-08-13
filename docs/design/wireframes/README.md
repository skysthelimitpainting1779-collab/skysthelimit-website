# Sky's Design Wireframe Foundation

These wireframes define page hierarchy before visual polish or animation. They are implementation contracts, not decorative mockups.

## Required surfaces

| Surface | Desktop | Mobile | Primary outcome |
|---|---|---|---|
| Home | Required | Required | Route the visitor to the correct service or estimate path |
| Residential | Required | Required | Establish trust and request an estimate |
| Commercial | Required | Required | Qualify scope and decision-maker |
| Public sector | Required | Required | Demonstrate capability and route procurement inquiries |
| Estimate flow | Required | Required | Create a qualified Convex lead |
| Customer portal | Required | Required | Show estimate, project, document, and payment state |
| Operations dashboard | Required | Tablet-aware | Manage leads, bids, jobs, crews, and approvals |

## Page anatomy

1. Utility header: service area, phone, accessibility-safe navigation.
2. Hero: specific outcome, one primary CTA, one proof point.
3. Trust rail: licensing, insurance, reviews, recognizable work types.
4. Service fit: residential, commercial, public-sector routing.
5. Proof: projects, process, before/after, testimonials.
6. Risk reversal: clear next step, response expectation, no-pressure language.
7. Estimate CTA: persistent but never obstructive.
8. Footer: contact, service area, legal, accessibility.

## Responsive rules

- Desktop uses a 12-column content grid with a readable maximum width.
- Mobile keeps the primary CTA visible without covering content.
- Navigation, forms, dialogs, and cards must work at 320 CSS pixels.
- Touch targets are at least 44 by 44 CSS pixels.
- Content order remains logical without animation or JavaScript.
- Motion enhances state and hierarchy but never reveals essential content exclusively.

## Accessibility contract

- WCAG 2.2 AA contrast and keyboard operation.
- Visible focus states.
- Semantic landmarks and heading order.
- Reduced-motion support.
- Error messages tied to fields and announced to assistive technology.
- Every image has a publication classification and useful alternative text where needed.

See `conversion-flow.md` for the lead journey and implementation acceptance criteria.
