import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

import postcss from "postcss"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { Badge } from "../src/components/ui/badge.tsx"
import { Button } from "../src/components/ui/button.tsx"
import { Input } from "../src/components/ui/input.tsx"

const rootUrl = new URL("../", import.meta.url)
const css = readFileSync(new URL("src/index.css", rootUrl), "utf8")
const homeClient = readFileSync(new URL("src/app/(marketing)/HomeClient.tsx", rootUrl), "utf8")
const stylesheet = postcss.parse(css)

function declarationsFor(selector) {
  const declarations = new Map()

  stylesheet.walkRules((rule) => {
    if (!rule.selectors?.includes(selector)) return
    rule.walkDecls((declaration) => {
      declarations.set(declaration.prop, declaration.value)
    })
  })

  return declarations
}

function themeDeclarations() {
  const declarations = new Map()

  stylesheet.walkAtRules("theme", (rule) => {
    rule.walkDecls((declaration) => {
      declarations.set(declaration.prop, declaration.value)
    })
  })

  return declarations
}

function resolveToken(name, declarations, trail = new Set()) {
  assert.ok(!trail.has(name), `CSS variable cycle detected at ${name}`)

  const value = declarations.get(name)
  assert.ok(value, `Missing CSS variable ${name}`)

  const reference = value.match(/^var\((--[\w-]+)\)$/)
  if (!reference) return value.toLowerCase()

  return resolveToken(reference[1], declarations, new Set([...trail, name]))
}

function relativeLuminance(hex) {
  assert.match(hex, /^#[0-9a-f]{6}$/i, `Expected a six-digit hex color, received ${hex}`)

  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255)
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  )

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first)
  const secondLuminance = relativeLuminance(second)
  const lighter = Math.max(firstLuminance, secondLuminance)
  const darker = Math.min(firstLuminance, secondLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

test("Measured Craft shadcn tokens keep the locked light and dark visual signature", () => {
  const theme = themeDeclarations()
  const light = new Map([...theme, ...declarationsFor(":root")])
  const dark = new Map([...light, ...declarationsFor(".dark")])

  const expectedLight = {
    "--background": "#eee8dd",
    "--foreground": "#191713",
    "--card": "#ffffff",
    "--card-foreground": "#191713",
    "--primary": "#ff5a00",
    "--primary-foreground": "#070706",
    "--muted": "#ded6c8",
    "--muted-foreground": "#5f5a52",
    "--destructive": "#c64232",
    "--destructive-foreground": "#ffffff",
    "--ring": "#d94d00",
  }
  const expectedDark = {
    "--background": "#070706",
    "--foreground": "#f7f5f0",
    "--card": "#0d0d0b",
    "--card-foreground": "#f7f5f0",
    "--primary": "#ff5a00",
    "--primary-foreground": "#070706",
    "--muted": "#15130f",
    "--muted-foreground": "#b7b0a4",
    "--destructive": "#c64232",
    "--destructive-foreground": "#ffffff",
    "--ring": "#ff5a00",
  }

  for (const [token, expected] of Object.entries(expectedLight)) {
    assert.equal(resolveToken(token, light), expected, `light ${token} drifted`)
  }
  for (const [token, expected] of Object.entries(expectedDark)) {
    assert.equal(resolveToken(token, dark), expected, `dark ${token} drifted`)
  }

  for (const palette of [light, dark]) {
    for (const [background, foreground] of [
      ["--background", "--foreground"],
      ["--card", "--card-foreground"],
      ["--primary", "--primary-foreground"],
      ["--muted", "--muted-foreground"],
      ["--destructive", "--destructive-foreground"],
    ]) {
      assert.ok(
        contrastRatio(resolveToken(background, palette), resolveToken(foreground, palette)) >= 4.5,
        `${foreground} must maintain 4.5:1 contrast on ${background}`
      )
    }

    assert.ok(
      contrastRatio(resolveToken("--ring", palette), resolveToken("--background", palette)) >= 3,
      "--ring must maintain 3:1 non-text contrast against --background"
    )
  }
})

test("rendered shadcn controls use semantic opaque focus indicators", () => {
  const rendered = [
    renderToStaticMarkup(React.createElement(Button, null, "Continue")),
    renderToStaticMarkup(React.createElement(Input, { "aria-label": "Project name" })),
    renderToStaticMarkup(
      React.createElement(Badge, { render: React.createElement("a", { href: "#details" }) }, "Ready")
    ),
  ].join("\n")

  assert.match(rendered, /bg-primary/)
  assert.match(rendered, /border-input/)
  assert.match(rendered, /focus-visible:ring-2/)
  assert.match(rendered, /focus-visible:ring-ring(?:\s|")/)
  assert.doesNotMatch(rendered, /focus-visible:ring-ring\/50/)
})

test("destructive shadcn variants use the verified foreground pair", () => {
  const rendered = [
    renderToStaticMarkup(React.createElement(Button, { variant: "destructive" }, "Delete")),
    renderToStaticMarkup(React.createElement(Badge, { variant: "destructive" }, "Needs attention")),
  ].join("\n")

  assert.match(rendered, /bg-destructive/)
  assert.match(rendered, /text-destructive-foreground/)
  assert.doesNotMatch(rendered, /bg-destructive\/(?:10|20)/)
})

test("interactive geometry preserves semantic radii and coarse-pointer targets", () => {
  const root = declarationsFor(":root")
  assert.equal(root.get("--radius"), "8px")
  assert.equal(root.get("--focus-ring-width"), "2px")
  assert.equal(root.get("--focus-ring-offset"), "3px")

  let forcedSquareGeometry = false
  stylesheet.walkRules((rule) => {
    if (!rule.selectors?.includes("*")) return
    rule.walkDecls("border-radius", (declaration) => {
      if (declaration.value === "0" || declaration.value === "0px") {
        forcedSquareGeometry = true
      }
    })
  })
  assert.equal(forcedSquareGeometry, false, "global radius-zero overrides semantic component geometry")

  let hasTokenFocus = false
  stylesheet.walkRules((rule) => {
    if (!rule.selector?.includes(":focus-visible")) return
    const declarations = new Map()
    rule.walkDecls((declaration) =>
      declarations.set(declaration.prop, {
        important: declaration.important,
        value: declaration.value,
      })
    )
    if (
      declarations.get("outline")?.value === "var(--focus-ring-width) solid var(--ring)" &&
      declarations.get("outline")?.important &&
      declarations.get("outline-offset")?.value === "var(--focus-ring-offset)" &&
      declarations.get("outline-offset")?.important
    ) {
      hasTokenFocus = true
    }
  })
  assert.ok(hasTokenFocus, "global keyboard focus must enforce semantic ring tokens over local utilities")

  let coarsePointerTargets = false
  stylesheet.walkAtRules("media", (rule) => {
    if (!rule.params.includes("pointer: coarse")) return
    rule.walkRules((targetRule) => {
      const declarations = new Map()
      targetRule.walkDecls((declaration) => declarations.set(declaration.prop, declaration.value))
      if (
        declarations.get("min-block-size") === "2.75rem" &&
        declarations.get("min-inline-size") === "2.75rem"
      ) {
        coarsePointerTargets = true
      }
    })
  })
  assert.ok(coarsePointerTargets, "coarse pointer controls must expose a 44px target baseline")
})

test("display headings preserve word boundaries and zero letter spacing", () => {
  const heroHeading = homeClient.match(/<h1 id="home-title" className="([^"]+)">/)
  assert.ok(heroHeading, "home hero heading contract must remain discoverable")
  assert.match(heroHeading[1], /\btracking-normal\b/)
  assert.match(heroHeading[1], /\btext-4xl\b/)
  assert.doesNotMatch(heroHeading[1], /tracking-\[/)
  assert.doesNotMatch(heroHeading[1], /\btext-5xl\b/)
  assert.doesNotMatch(heroHeading[1], /\blg:text-8xl\b/)

  let headingWrap
  stylesheet.walkRules((rule) => {
    if (!rule.selectors?.includes("h1")) return
    rule.walkDecls("overflow-wrap", (declaration) => {
      headingWrap = declaration.value
    })
  })
  assert.equal(headingWrap, "normal")
})
