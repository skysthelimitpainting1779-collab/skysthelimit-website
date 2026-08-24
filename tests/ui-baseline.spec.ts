import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("public design-system baseline meets WCAG and visual contracts", async ({
  page,
}) => {
  await page.goto("/refer")
  await page.locator("main").waitFor()
  await page.evaluate(() => {
    document.body.className = "bg-background text-foreground p-8"
    document.body.innerHTML = `
      <main aria-labelledby="baseline-title" class="mx-auto grid max-w-3xl gap-8">
        <header class="grid gap-2">
          <p class="text-sm font-medium text-muted-foreground">STL-301</p>
          <h1 id="baseline-title" class="text-3xl font-semibold">Design-system baseline</h1>
          <p class="max-w-prose text-muted-foreground">Semantic tokens, accessible controls, and stable industrial geometry.</p>
        </header>
        <section aria-labelledby="actions-title" class="grid gap-4 border border-border bg-card p-6 text-card-foreground">
          <h2 id="actions-title" class="text-xl font-semibold">Actions</h2>
          <div class="flex flex-wrap gap-3">
            <button class="inline-flex h-11 items-center justify-center bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50">Primary action</button>
            <button class="inline-flex h-11 items-center justify-center border border-border bg-background px-4 text-sm font-medium text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">Secondary action</button>
          </div>
        </section>
        <section aria-labelledby="field-title" class="grid gap-4 border border-border bg-card p-6 text-card-foreground">
          <h2 id="field-title" class="text-xl font-semibold">Field</h2>
          <label for="baseline-field" class="text-sm font-medium">Project name</label>
          <input id="baseline-field" class="h-11 border border-input bg-background px-3 text-foreground placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50" placeholder="Exterior repaint" />
          <p class="text-sm text-muted-foreground">Visible label, helper text, and keyboard focus are required.</p>
        </section>
      </main>
    `
  })

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze()

  expect(accessibility.violations).toEqual([])
  const controls = page.locator("button, input")
  for (let index = 0; index < (await controls.count()); index += 1) {
    const box = await controls.nth(index).boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
  }

  await expect(page.locator("main")).toHaveScreenshot("design-system.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  })
})
