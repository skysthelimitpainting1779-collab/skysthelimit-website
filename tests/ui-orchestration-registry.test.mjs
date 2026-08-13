import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const rootUrl = new URL("../", import.meta.url)

function read(path) {
  return readFileSync(new URL(path, rootUrl), "utf8")
}

function relativeLuminance(hex) {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    )
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastRatio(first, second) {
  const luminances = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => b - a,
  )
  return (luminances[0] + 0.05) / (luminances[1] + 0.05)
}

test("the shadcn registry exposes independent Measured Craft modules", () => {
  const registry = JSON.parse(read("registry.json"))
  const items = new Map(registry.items.map((item) => [item.name, item]))

  assert.equal(registry.$schema, "https://ui.shadcn.com/schema/registry.json")
  assert.match(registry.homepage, /^https:\/\/github\.com\//)
  assert.deepEqual(
    [...items.keys()].sort(),
    [
      "measured-craft-agent-rules",
      "measured-craft-controls",
      "measured-craft-motion",
      "measured-craft-tokens",
    ],
  )

  const controls = items.get("measured-craft-controls")
  const controlPaths = controls.files.map((file) => file.path)
  assert.deepEqual(controls.registryDependencies, [
    "skysthelimitpainting1779-collab/skys-the-limit-painting-llc-website/measured-craft-tokens",
  ])
  assert.ok(controlPaths.includes("src/components/ui/button.tsx"))
  assert.ok(controlPaths.includes("src/components/ui/badge.tsx"))
  assert.ok(controlPaths.includes("src/components/ui/input.tsx"))
  assert.ok(controlPaths.includes("src/lib/utils.ts"))

  const motion = items.get("measured-craft-motion")
  assert.ok(motion.dependencies.includes("motion"))
  assert.deepEqual(
    motion.files.map((file) => file.path).sort(),
    [
      "src/components/animations/FadeIn.tsx",
      "src/components/animations/HoverLift.tsx",
      "src/components/animations/Stagger.tsx",
    ],
  )

  const tokens = items.get("measured-craft-tokens")
  assert.equal(tokens.type, "registry:style")
  assert.equal(tokens.cssVars.dark.background, "#070706")
  assert.equal(tokens.cssVars.dark.ring, "#FF5A00")
  assert.equal(tokens.cssVars.light.background, "#EEE8DD")
  assert.equal(tokens.cssVars.light.ring, "#D94D00")
})

test("Motion registry primitives honor reduced motion at the component boundary", () => {
  for (const path of [
    "src/components/animations/FadeIn.tsx",
    "src/components/animations/HoverLift.tsx",
    "src/components/animations/Stagger.tsx",
  ]) {
    const source = read(path)
    assert.match(source, /from ['"]motion\/react['"]/)
    assert.match(source, /\buseReducedMotion\b/)
    assert.doesNotMatch(source, /from ['"]framer-motion['"]/)
  }
})

test("homepage Motion consumers honor reduced motion instead of relying on CSS", () => {
  for (const path of [
    "src/components/LeadForm.tsx",
    "src/components/ReviewCarousel.tsx",
  ]) {
    const source = read(path)
    assert.match(source, /\buseReducedMotion\b/)
    assert.match(source, /\bprefersReducedMotion\b/)
  }
})

test("interactive shadcn states use opaque AA color pairs and badge links get coarse targets", () => {
  const button = read("src/components/ui/button.tsx")
  const badge = read("src/components/ui/badge.tsx")
  const css = read("src/index.css")

  for (const source of [button, badge]) {
    assert.doesNotMatch(source, /hover:bg-primary\/80/)
    assert.doesNotMatch(source, /hover:bg-destructive\/90/)
    assert.match(source, /hover:bg-\[var\(--primary-hover\)\]/)
    assert.match(source, /hover:bg-\[var\(--destructive-hover\)\]/)
  }
  assert.doesNotMatch(badge, /\shover:bg-\[var/)
  assert.match(badge, /\[a\]:hover:bg-\[var\(--primary-hover\)\]/)
  assert.match(badge, /\[button\]:hover:bg-\[var\(--primary-hover\)\]/)
  assert.match(css, /--color-danger-hover:\s*#A73528/i)
  assert.match(css, /--primary-hover:\s*var\(--color-signal-hover\)/)
  assert.match(css, /--destructive-hover:\s*var\(--color-danger-hover\)/)
  assert.match(css, /a\[href\]\[data-slot="badge"\]/)

  const signalHover = css.match(/--color-signal-hover:\s*(#[0-9a-f]{6})/i)?.[1]
  const dangerHover = css.match(/--color-danger-hover:\s*(#[0-9a-f]{6})/i)?.[1]
  const canvas = css.match(/--color-canvas:\s*(#[0-9a-f]{6})/i)?.[1]
  const white = "#FFFFFF"
  assert.ok(signalHover && canvas && contrastRatio(signalHover, canvas) >= 4.5)
  assert.ok(dangerHover && contrastRatio(dangerHover, white) >= 4.5)
})

test("UI agents share one mirrored orchestration skill and preserve Convex ownership", () => {
  const agentSkill = read(".agents/skills/award-winning-ui-orchestration/SKILL.md")
  const githubSkill = read(".github/skills/award-winning-ui-orchestration/SKILL.md")

  assert.equal(agentSkill, githubSkill)
  for (const requiredSkill of [
    "impeccable",
    "ui-ux-pro-max",
    "shadcn-measured-craft",
    "motion",
    "anti-slop-ui-review",
    "clerk-convex-authorization",
  ]) {
    assert.match(agentSkill, new RegExp(`\\b${requiredSkill}\\b`))
  }
  assert.match(agentSkill, /do not create a second Convex provider/i)
  assert.match(agentSkill, /independent verifier/i)
  assert.match(read("AGENTS.md"), /award-winning-ui-orchestration/)
})

test("Antigravity exposes the official shadcn MCP alongside project graph tools", () => {
  const config = JSON.parse(read(".agents/mcp_config.json"))
  const shadcn = config.mcpServers.shadcn

  assert.match(shadcn.command, /^npx(?:\.cmd)?$/i)
  assert.deepEqual(shadcn.args, ["-y", "shadcn@4.16.0", "mcp"])
  assert.equal(shadcn.disabled, false)
  assert.ok(config.mcpServers.graphify)
  assert.ok(config.mcpServers["agentgraph-dev"])
})
