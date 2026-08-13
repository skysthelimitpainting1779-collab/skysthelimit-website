---
name: brand
description: Brand voice, visual identity, messaging frameworks, asset management, brand consistency. Activate for branded content, tone of voice, marketing assets, brand compliance, style guides.
argument-hint: "[update|review|create] [args]"
metadata:
  author: claudekit
  version: "1.0.0"
---

# Brand

Brand identity, voice, messaging, asset management, and consistency frameworks.

## When to Use

- Brand voice definition and content tone guidance
- Visual identity standards and style guide development
- Messaging framework creation
- Brand consistency review and audit
- Asset organization, naming, and approval
- Color palette management and typography specs

## Quick Start

**Inject brand context into prompts:**
```bash
node .agents/skills/brand/scripts/inject-brand-context.cjs
node .agents/skills/brand/scripts/inject-brand-context.cjs --json
```

**Validate an asset:**
```bash
node .agents/skills/brand/scripts/validate-asset.cjs <asset-path>
```

**Extract/compare colors:**
```bash
node .agents/skills/brand/scripts/extract-colors.cjs --palette
node .agents/skills/brand/scripts/extract-colors.cjs <image-path>
```

## Brand Sync Workflow

```bash
# 1. Initialize docs/brand-guidelines.md from the bundled starter when absent
# 2. Edit docs/brand-guidelines.md (or use /brand update)
# 3. Sync to design tokens
node .agents/skills/brand/scripts/sync-brand-to-tokens.cjs
# 4. Verify
node .agents/skills/brand/scripts/inject-brand-context.cjs --json
```

**Files synced:**
- `docs/brand-guidelines.md` → Source of truth
- `assets/design-tokens.json` → Token definitions
- `assets/design-tokens.css` → CSS variables

## Subcommands

| Subcommand | Description | Reference |
|------------|-------------|-----------|
| `update` | Update brand identity and sync to all design systems | `.agents/skills/brand/references/update.md` |

## References

| Topic | File |
|-------|------|
| Voice Framework | `.agents/skills/brand/references/voice-framework.md` |
| Visual Identity | `.agents/skills/brand/references/visual-identity.md` |
| Messaging | `.agents/skills/brand/references/messaging-framework.md` |
| Consistency | `.agents/skills/brand/references/consistency-checklist.md` |
| Guidelines Template | `.agents/skills/brand/references/brand-guideline-template.md` |
| Asset Organization | `.agents/skills/brand/references/asset-organization.md` |
| Color Management | `.agents/skills/brand/references/color-palette-management.md` |
| Typography | `.agents/skills/brand/references/typography-specifications.md` |
| Logo Usage | `.agents/skills/brand/references/logo-usage-rules.md` |
| Approval Checklist | `.agents/skills/brand/references/approval-checklist.md` |

## Scripts

| Script | Purpose |
|--------|---------|
| `.agents/skills/brand/scripts/inject-brand-context.cjs` | Extract brand context for prompt injection |
| `.agents/skills/brand/scripts/sync-brand-to-tokens.cjs` | Sync brand-guidelines.md → design-tokens.json/css |
| `.agents/skills/brand/scripts/validate-asset.cjs` | Validate asset naming, size, format |
| `.agents/skills/brand/scripts/extract-colors.cjs` | Extract and compare colors against palette |

## Templates

| Template | Purpose |
|----------|---------|
| `.agents/skills/brand/templates/brand-guidelines-starter.md` | Complete starter template for new brands |

## Routing

1. Parse subcommand from `$ARGUMENTS` (first word)
2. Load corresponding `.agents/skills/brand/references/{subcommand}.md`
3. Execute with remaining arguments
