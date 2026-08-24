import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  outputDir: "output/playwright/stl-301-results",
  reporter: [["line"]],
  use: {
    baseURL: "http://127.0.0.1:3101",
    colorScheme: "dark",
    reducedMotion: "reduce",
  },
  webServer: {
    command: "npx next dev --port 3101 --hostname=127.0.0.1",
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"], channel: "chrome" },
    },
  ],
})
