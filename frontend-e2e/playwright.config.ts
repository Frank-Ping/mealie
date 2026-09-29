import { defineConfig, devices } from "@playwright/test";
import { ADMIN_STATE } from "./lib/fixtures";

const PORT = Number(process.env.E2E_PORT ?? 9091);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  // The dev box has 3.8 GB RAM and shares it with the backend: keep the browser count low.
  workers: Number(process.env.E2E_WORKERS ?? 2),
  fullyParallel: false,
  // Flakes must be fixed, not retried away: a retry would hide them from the yardstick.
  retries: 0,
  forbidOnly: true,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/results.json" }],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  globalSetup: "./global-setup.ts",
  use: {
    baseURL,
    locale: "en-US",
    timezoneId: "UTC",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "routes",
      testMatch: /routes\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, storageState: ADMIN_STATE },
    },
    {
      name: "flows",
      testMatch: /flows\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, storageState: ADMIN_STATE },
    },
  ],
  webServer: {
    command: "./scripts/start-backend.sh",
    url: `${baseURL}/api/app/about`,
    // Fresh database every run unless explicitly asked to reuse (handy while writing tests only).
    reuseExistingServer: process.env.E2E_REUSE_SERVER === "1",
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
    env: { E2E_PORT: String(PORT) },
  },
});
