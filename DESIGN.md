---
name: "Sky's the Limit Painting — Owner's Finish Ledger"
description: "A paper-led public marketing system that turns owner accountability and written scope into visible structure."
colors:
  ledger-paper: "#F6F3EB"
  ledger-ink: "#071321"
  ledger-cobalt: "#0254C3"
  ledger-orange: "#FF661C"
  ledger-body: "#314457"
  ledger-muted: "#53616F"
  internal-canvas: "#050505"
  internal-surface: "#0A0A0A"
  internal-text: "#F7F7F7"
  internal-muted: "#9CA3AF"
  internal-orange: "#FF5A00"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(3.2rem, 5vw, 5.5rem)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.02em"
  display-hero:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(3.5rem, 6.6vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "0.08em"
  mono:
    fontFamily: "ui-monospace, Cascadia Code, Segoe UI Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  square: "0px"
spacing:
  rule-gap: "8px"
  control-gap: "12px"
  content-inset: "20px"
  section-mobile: "64px"
  section-desktop: "96px"
components:
  button-primary:
    backgroundColor: "{colors.ledger-orange}"
    textColor: "{colors.ledger-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "16px 24px"
    height: "56px"
  button-secondary:
    backgroundColor: "{colors.ledger-paper}"
    textColor: "{colors.ledger-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "16px 24px"
    height: "56px"
  form-field:
    backgroundColor: "rgba(255, 255, 255, 0.42)"
    textColor: "{colors.ledger-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "16px"
    height: "52px"
  mobile-book-action:
    backgroundColor: "{colors.ledger-orange}"
    textColor: "{colors.ledger-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    height: "56px"
---

# Design System: Sky's the Limit Painting

## Overview

**Creative North Star: “The Owner's Finish Ledger”**
**Direction seed:** `14f4dd46`

The public marketing system is a working contractor's record: warm paper, dark ink, measured rules, jobsite photographs, and one cobalt tape seam holding the composition together. It makes preparation, written scope, and Anthony Briseno's direct accountability visible before it asks for contact details. The mode is **Persuade**, but the proof language remains plainspoken and evidence-bound.

This system governs every public marketing and conversion route: homepage, market pages, service and area pages, about, projects, capabilities, service area, contact, estimator, referral, and review. It does **not** replace the existing dark industrial language of `/portal`, `/admin`, CMS, or other internal/operational product surfaces. Those remain near-black, compact, predictable, and shadcn-aligned; use this light ledger world there only after a separate product-surface decision.

Implementation authority, in order: `PRODUCT.md`; the normative token frontmatter in this document; then the current homepage, header, form, preparation stage, layout, and global CSS. Visual review artifacts are local working evidence, not required repository inputs.

**Key characteristics:**

- Paper-led, rule-built, flat, and square-edged.
- Owner-led scope copy before broad quality language.
- Real work imagery with explicit proof restrictions.
- Orange for the next action; cobalt for records, selection, and structure.
- Responsive conversion that keeps Call, Text, and Book continuously available on mobile.

## Colors

The public palette reads like a blue-marked work order with a high-visibility action tab. Token values are defined in frontmatter.

### Public marketing roles

- **Ledger Paper:** Default public canvas, cards, header, forms, and image captions. Slight white variation is allowed only for hierarchy within the paper family.
- **Ledger Ink:** Headlines, strong labels, rules at reduced opacity, and the dark accountability band.
- **Ledger Cobalt:** Process numbers, selected controls, focus, links, progress, grid lines at low opacity, and the tape seam. It is structural, not a competing CTA color.
- **Ledger Orange:** Primary booking actions and small preparation signals. Use it sparingly so the next step is unmistakable.
- **Ledger Body / Muted:** Long-form copy, captions, placeholders, and secondary labels on paper. Do not reduce opacity until contrast becomes marginal; use the named solid tones.

**The Two-Signal Rule.** Cobalt explains or selects; orange asks for action. Never reverse those roles without a tested interaction reason.

**The Paper Majority Rule.** Public marketing stays predominantly paper. Ledger Ink may form a full accountability or footer band, but do not return the homepage to an all-dark hero.

### Internal and operational roles

Portal/admin/internal product surfaces retain **Internal Canvas**, **Internal Surface**, **Internal Text**, **Internal Muted**, and **Internal Orange**. Their accent remains the existing safety orange, not Ledger Orange. Keep semantic shadcn colors for stateful product UI; do not transplant the public cobalt/paper palette into dense operational screens by default.

## Typography

**Display Font:** Barlow Condensed with Arial Narrow fallback.
**Body Font:** Source Sans 3 with system sans-serif fallback.
**Data Font:** System monospace for stage IDs and compact record metadata only.

Barlow Condensed gives public headings the authority of a job ticket without the extreme narrowness that made longer headings feel distorted; Source Sans 3 keeps scopes, form labels, and homeowner guidance readable. Both are self-hosted through `next/font` with swap behavior.

### Hierarchy

- **Hero display:** Use the `display-hero` token, sentence case, a short measure near 11 characters, and balanced wrapping. Do not decorate one word merely to add color.
- **Section display:** Use the `display` token, generally 7–8 characters wide for split-panel headings. Uppercase is appropriate for short stage titles, not required for narrative headings.
- **Body:** Default to the body token; major supporting copy may rise to 18–20px with 28–32px line height. Keep long public copy near 65 characters per line.
- **Labels:** Bold, uppercase, and tracked for record captions, utility bars, and controls. Do not use label styling for paragraphs.
- **Mono:** Reserve for stage numbers, progress, or machine-like record details; customer-facing explanations remain Source Sans 3.

**The Compressed-Headline Rule.** Barlow Condensed carries message hierarchy, not UI chrome everywhere. Navigation, forms, and explanatory copy stay in Source Sans 3.

Internal product surfaces may continue using the established dense sans/mono hierarchy. The ledger display face is not a dashboard default.

## Layout

The homepage hero is a desktop **58/42 paper/photo split** at the large breakpoint. The copy panel uses a faint cobalt ledger grid; the photo panel carries top and bottom record captions. A torn cobalt tape strip marks the seam. On mobile, the split stacks copy above photo and the tape rotates into a horizontal seam.

Public content is contained at approximately 92–94rem. Major sections use ruled split grids rather than floating cards: 72/128 or 70/130 text/content relationships, edge-to-edge rows, and shared borders. Desktop section rhythm is typically 80–112px; mobile is approximately 64px. Paper rules use Ledger Ink around 18–25% opacity; grid lines use Cobalt around 8–10% opacity.

The five-stage ledger remains a single horizontal record on wide layouts and may horizontally scroll when preserving its sequence is clearer than wrapping. Preparation, accountability, FAQ, and conversion sections stack at narrow widths. Do not force desktop asymmetry into unreadably narrow columns.

The fixed header is 112px tall: 32px utility row plus 80px primary row. Mobile reserves bottom space for a fixed three-column rail: Call and Text are equal smaller actions; Get a Free Price Range receives the largest orange column. Controls must remain at least 44px high; principal actions are 48–56px.

**The Shared-Rule Rule.** Adjacent blocks meet on one rule. Avoid card gaps, detached shadows, or rounded tiles when a ledger row or ruled split communicates the relationship better.

## Elevation & Depth

The ledger system is flat by default. Hierarchy comes from paper tone, rules, grid, photography, and dark/light reversal, not floating cards. The fixed header uses one restrained navy-tinted shadow and the open mobile navigation may use the same restrained panel depth. No other routine marketing element needs elevation.

Photography supplies physical depth. Keep overlays functional and localized to caption legibility; do not wash the entire public system in gradients, glass, or ambient glow.

**The Flat Record Rule.** If a component can be separated with a rule or tonal reversal, do that before adding a shadow.

## Shapes

All interface radii are **0px**. Buttons, fields, cards, navigation, controls, and form choices use square industrial edges. Borders are fine ledger rules, not decorative outlines.

The torn tape seam is the intentional organic exception: cobalt, irregular, narrow, and placed only where the hero's paper and jobsite record join. It becomes horizontal on mobile. Do not repeat torn edges as general decoration.

The approved illustrated badge at `public/brand/SkyLLP_BrandLogo.svg` is the canonical company mark. Preserve its recognizable artwork, proportions, and color; do not redraw it into a generic monogram, recolor it to match the ledger palette, or use the UI's zero-radius rule to crop its silhouette.

## Components

### shadcn architecture

The public system uses three token layers in `src/index.css`:

1. `--sky-*` primitives hold raw brand color and spacing values.
2. Scoped shadcn semantic variables such as `--background`, `--primary`, `--trust`, `--border`, and `--ring` assign purpose within `.public-surface` and its paper, soft, ink, and trust tones.
3. Component and composition variables such as `--button-bg`, `--input-bg`, `--card-shadow`, `--public-section-y`, and `--public-gutter` govern reusable UI behavior.

Local primitives live in `src/components/ui/`. Public compositions live in `src/components/public/`. Route components compose these modules and pass layout-only `className` values; color, typography, state, and component appearance belong in primitive variants or semantic tokens.

Forms use shadcn `Field`, `FieldGroup`, `Input`, `Textarea`, `ToggleGroup`, `Slider`, and `Progress`. Option sets of two through seven items use `ToggleGroup`. Labels remain visible and programmatically associated. Invalid state requires both `data-invalid` on `Field` and `aria-invalid` on the control.

The project contract is Tailwind v4, Base UI, Nova style, lucide icons, CSS variables, and radius none. Base UI controlled single-value ToggleGroups wrap values in arrays; Base UI single-thumb Sliders accept scalar values.

### Documentation contract

- Context7 shadcn library: `/shadcn-ui/ui`. Contract used: Tailwind v4 `@theme inline` mappings, scoped semantic CSS variables, local primitive composition, CLI dry-run/diff safety, Base UI ToggleGroup arrays, scalar Slider values, and Field validation semantics.
- Context7 Next.js library: `/vercel/next.js/v16.2.9`. Contract used: define each Google font once with `variable` and `display: 'swap'`, attach both variables to the root html element, reference those variables through global design tokens, and use the Next 16 `preload` image contract for genuine above-the-fold images instead of deprecated `priority`.
- shadcn CLI project inspection: Next.js 16.3.1, Tailwind v4, `base-nova`, Base UI, lucide, and radius none. Added components were previewed with `--dry-run`; no existing component was overwritten.

### Conversion header and brand

- Use the paper header with a thin ink rule, uppercase utility facts, the canonical illustrated badge, and a compact digital wordmark.
- Keep the phone truth visible: **Call / Text 651-410-4196**. Desktop provides Call Anthony plus the orange booking action; mobile provides the menu and relies on the bottom conversion rail for persistent actions.
- Current-path navigation uses cobalt text and a short cobalt underline. Hover/focus must not shift layout.

### Buttons and links

- Primary booking actions use Ledger Orange with Ledger Ink, square corners, bold type, and a 48–56px target.
- Secondary direct-call actions use paper/transparent fill, a reduced-opacity ink border, and cobalt on hover/focus.
- Cobalt-filled buttons indicate selected process/form state, not the primary conversion action.
- Use one label per intent: “Get a Free Price Range” for the estimator, “Call Anthony” for direct contact, and “Start the Written Scope” for a detailed project form.

### Hero and ledger records

- Preserve the 58/42 composition, grid, tape seam, field-record captions, two-action hierarchy, and three short commitments.
- Stage ledgers use numbered rows, connecting rules, compressed titles, and short scope language. They are operational proof of process, not generic feature cards.
- Use real jobsite imagery whenever verified and available. Alt text describes visible work and protection; it does not claim a customer, location, result, or company authorship that the evidence does not establish.

### Preparation viewer

- The stage selector is a ruled list paired with one large work image. Selected state is cobalt/paper; resting state is paper/ink.
- Selection must work by click/tap and expose `aria-pressed`; hover can reinforce but cannot be the only control.
- Image captions name the stage, control, and output. Keep the explanation bound to written scope and observable preparation.

### Accountability band

- The dark Ledger Ink band is the public system's deliberate reversal, not a return to the older dark marketing world.
- Pair a preparation photograph with the owner-accountability message and ruled facts. Say **Minnesota registration**, never “licensed,” until legal classification is verified.
- Do not imply that a pictured project is verified customer proof unless the proof ledger supports that claim.

### Lead form

- The ledger variant presents project information before contact information in three explicit steps. Progress, labels, errors, back/next actions, selected states, and submission status remain visible and keyboard-operable.
- Paper fields use an ink rule and light translucent fill; selected choices and progress use cobalt; next/submit use orange; secondary back actions remain outline-only.
- Keep labels programmatic, errors specific and announced, upload status visible, preferred contact choices explicit, and privacy reassurance adjacent to submission.

### Mobile conversion rail

- Fix it to the viewport bottom below 768px with **Call / Text / Get a Free Price Range** in that order.
- Use a 0.75 / 0.75 / 1.5 column ratio, paper for Call/Text, and orange for the estimator. Reserve page padding so content and controls are never obscured.

### Contact, badge, and proof truth

- Company: **Sky's the Limit Painting LLC**; owner: **Anthony Briseno**.
- Phone: **651-410-4196**; email: **skysthelimitpainting1779@gmail.com**.
- Public address: **1445 56th St E, Inver Grove Heights, MN 55077**.
- The Drive-approved illustrated badge is `BRAND-001` and is canonical for website use.
- Existing Drive portfolio images are approved for marketing-layout use only until ownership, location, authenticity, property permission, and model releases are verified. Never label them as completed-customer proof while that status is open.

## Do's and Don'ts

### Do

- **Do** lead public conversion with owner involvement, written scope, preparation, and the walkthrough.
- **Do** use Ledger Orange for the primary next action and Cobalt for process, selection, focus, and record structure.
- **Do** keep the 58/42 paper/photo hero, ledger grid/rules, and single tape seam recognizable across responsive layouts.
- **Do** preserve the canonical illustrated badge and the exact contact truth above.
- **Do** meet WCAG 2.2 AA: readable contrast and type, visible focus, logical headings and labels, keyboard operation, 200% zoom/reflow, descriptive errors, and appropriately sized touch targets.
- **Do** honor `prefers-reduced-motion`; the tape-set animation and all nonessential motion must stop or collapse to an immediate state.
- **Do** retain the dark industrial system for portal/admin/internal surfaces unless that surface receives its own redesign decision.

### Don't

- **Don't** apply the old dark full-bleed marketing hero, safety-orange-only palette, Satoshi/Geist pairing, trust-chip row, pill CTAs, or overlapping dark path cards to the shipped homepage.
- **Don't** round marketing controls, add generic three-card feature rows, or replace shared ledger rules with floating cards.
- **Don't** use stock-like perfection, invented ratings, testimonials, schedules, response times, prices, performance claims, or unsupported “best quality” language.
- **Don't** call the company licensed or portray registration as a license.
- **Don't** describe Drive portfolio imagery as verified completed work until permissions and provenance are closed.
- **Don't** hide Call or Text behind the booking form on mobile, and don't collect contact details before visitors can describe the project.
- **Don't** make motion, hover, color alone, or fine print carry essential meaning.
