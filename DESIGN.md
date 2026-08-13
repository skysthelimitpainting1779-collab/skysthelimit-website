# Sky’s the Limit — Product and Marketing Design System

**Status:** implementation-locked
**Version:** 3.0.0
**Prepared:** 2026-07-27T12:55:28+00:00
**Audit reference:** `c7e94605eefdace7a76ce5145808478df8503dbb`

This file and the files under `design/` are the visual and interaction source of truth. Codex implements them; it does not reopen the design unless a current route or verified requirement cannot be represented.

## 1. Product idea

**Measured Craft**

A premium contractor system that combines the physical honesty of a prepared jobsite with the precision of a measured scope. The interface should feel established, direct, and useful—not like a generic SaaS dashboard or a luxury mood board.

### Principles

1. **Proof before polish**
2. **Preparation is visible**
3. **One next action per screen**
4. **Information density follows the user**
5. **Orange signals action, not decoration**
6. **Customer files and business facts feel controlled**
7. **Every claim can point to evidence**

## 2. Surfaces

| Surface | Route group | Character | Density |
|---|---|---|---:|
| Public marketing | `/` | Editorial contractor confidence | 4/10 |
| Customer portal | `/portal` | Calm project clarity | 6/10 |
| Operator cockpit | `/app` | Dense operational command | 8/10 |
| Legacy surfaces | `/manage`, `/admin` | Migration-only; no new design work | — |

## 3. Brand and color

### Core tokens

| Token | Value | Use |
|---|---|---|
| `--canvas` | `#070706` | Main dark background |
| `--surface-1` | `#0D0D0B` | Raised panels |
| `--surface-2` | `#15130F` | Active/selected panels |
| `--ink` | `#F7F5F0` | Primary text |
| `--ink-muted` | `#B7B0A4` | Secondary text |
| `--ink-faint` | `#7D776E` | Captions/disabled |
| `--signal` | `#FF5A00` | Primary action and active state |
| `--signal-hover` | `#E94F00` | Hover/pressed action |
| `--trust` | `#2E7D32` | Verified success only |
| `--warning` | `#D9A441` | Due/attention state |
| `--danger` | `#C64232` | Destructive/error state |
| `--rule` | `rgba(255,255,255,.12)` | Borders/dividers |
| `--paper` | `#EEE8DD` | Warm light document surface |
| `--paper-ink` | `#191713` | Text on paper |

### Usage

- Orange is reserved for the most important available action, focus, and selected navigation.
- Never make every icon or heading orange.
- Status color never replaces a text label.
- Light paper surfaces are used for estimates, proposals, agreements, and document previews.
- No purple AI gradients, neon bloom, or fake metallic effects.

## 4. Typography

- **Body/UI:** Geist Sans
- **Display:** Satoshi only when a licensed local asset already exists; otherwise Geist Sans 800/900
- **Data/IDs:** Geist Mono
- Do not fetch blocking web fonts.
- Public H1: `clamp(3rem, 7vw, 7rem)`, tight but readable.
- Product page title: 28–36px.
- Body: 16–18px public, 14–16px product.
- Long copy width: 60–68 characters.

## 5. Geometry and spacing

- Public sections use a 12-column grid, max width 1440px.
- Portal uses 12 columns with a 280px navigation rail on desktop.
- Operator uses a 240px rail, sticky command bar, and resizable detail regions.
- Base spacing unit: 4px.
- Public section rhythm: 80–128px desktop, 56–80px mobile.
- Product region gaps: 16–24px.
- Industrial content blocks: 0–4px radius.
- Inputs, buttons, dialogs, and interactive cards: semantic 6–12px radius.
- Do not globally force radius zero.

## 6. Navigation

### Public

Utility strip → primary navigation → contextual breadcrumb where required.

Primary items:

- Residential
- Commercial
- Public Sector
- Projects
- Service Areas
- About
- Resources

Persistent actions:

- Check project range
- Call Anthony

### Customer

- Overview
- Project
- Appointments
- Documents
- Payments
- Messages

### Operator

- Overview
- Leads
- Pipeline
- Calendar
- Estimates
- Proposals
- Projects
- Tasks
- Automations
- Content
- Growth
- Analytics
- Settings

## 7. Public-page conversion pattern

1. Context-specific headline
2. Specific outcome and audience
3. Primary action
4. Real proof near the action
5. What happens next
6. Scope/capability clarity
7. Objection handling
8. Project evidence
9. Final action

No public page should begin with an internal company biography.

## 8. Components

Use source-owned shadcn components first.

### Foundation

- Button
- Field / FieldGroup
- Input / Textarea / Select / ToggleGroup
- Card
- Badge
- Alert
- Separator
- Tabs
- Table
- Sheet
- Dialog / AlertDialog
- DropdownMenu
- Command
- Calendar
- Skeleton
- Empty
- Tooltip
- Breadcrumb
- Progress
- Timeline custom composition
- DataTable custom composition

### Contractor-specific compositions

- ProofStamp
- ScopeSummary
- PreparationChecklist
- ProjectEvidenceCard
- PlanningRange
- NextActionPanel
- StatusTimeline
- DocumentApproval
- PropertyHeader
- OpportunityStage
- IntegrationHealthCard
- AssignmentBoard

## 9. Forms

- One decision per step in long intake.
- Show progress and what remains.
- Preserve entered values without storing raw PII in browser persistence.
- Display validation next to the field.
- Required and optional fields are explicit.
- File upload explains privacy and accepted types.
- Submit state clearly distinguishes saved, delivering, delivered, and needs-attention.
- Every error offers a concrete fallback action.

## 10. States

Every authenticated page and data-driven public component must define:

- loading
- empty
- populated
- partial
- error
- offline where relevant
- permission denied
- disabled account
- stale provider
- success confirmation

## 11. Motion

- Use transform and opacity for interface motion.
- Duration: 120–220ms product; 240–500ms editorial reveal.
- Respect reduced motion.
- Motion communicates hierarchy or state; it is not constant decoration.
- Remotion assets use deterministic frame-based animation and the `remotion-production` skill.

## 12. Photography and media

Use:

- real owner and crew
- real projects
- real preparation details
- real property context
- process documentation
- verified before/after pairs

Do not publish:

- fabricated jobsite photos
- altered logos
- unnamed stock presented as company work
- AI-generated project evidence
- fake review portraits

Generated concept media may be used only when clearly decorative and not presented as proof.

## 13. Copy system

- Headline says what the customer gains or understands.
- Subhead identifies project context and operating area.
- CTA describes the action, not “Learn more.”
- Avoid “premium,” “elite,” and “industry-leading” unless the surrounding evidence earns the implication.
- Explain preparation in normal language.
- Keep public-sector copy factual and documentation-led.
- Use customer questions as section headings when useful.

## 14. Accessibility

- WCAG 2.2 AA
- Visible keyboard focus
- 44px touch targets
- Logical heading order
- Dialog/sheet titles
- Labels and descriptions for fields
- Color contrast verified
- Status is not color-only
- Reduced motion
- Alternative text describes evidence, not marketing filler
- Tables have mobile alternatives or horizontal containment

## 15. Responsive behavior

- Desktop wireframes define information hierarchy, not fixed pixel positions.
- Mobile preserves the primary action and next action.
- Dense operator tables become card/row summaries with drill-in sheets.
- Sticky mobile bottom actions are permitted for call, estimate, approval, and payment.
- No horizontal page scrolling.

## 16. Design gate

The complete design artifacts are already supplied:

- route inventory
- information architecture
- user flows
- 51 unique page wireframes
- page-state matrix
- component inventory
- marketing application matrix
- copy/message architecture

Codex may adjust a wireframe only when current code or verified requirements prove a conflict. The change must be logged in `design/DESIGN_CHANGELOG.md` with the affected route, reason, and acceptance evidence.
