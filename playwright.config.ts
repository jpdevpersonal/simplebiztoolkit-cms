import { defineConfig, devices } from "@playwright/test";
import fs from "fs";

const isCI = !!process.env.CI;
const hasNextBuild = fs.existsSync(".next/BUILD_ID");
const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL = `http://localhost:${port}`;

const webServerCommand = isCI
  ? `npm run build && npm run start -- -p ${port}`
  : hasNextBuild
    ? `npm run start -- -p ${port}`
    : `npm run dev -- --port ${port}`;

export default defineConfig({
  testDir: "./src/e2e",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: webServerCommand,
    url: baseURL,
    // Always start a fresh server for Playwright tests to avoid reusing a
    // potentially stale or crashed dev server (which can surface Next.js
    // overlay runtime errors and cause flaky failures). Developers running
    // the dev server locally should stop it before running the test suite.
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
