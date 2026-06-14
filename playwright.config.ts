import { defineConfig, devices } from "@playwright/test";
import fs from "fs";

const isCI = !!process.env.CI;
const hasNextBuild = fs.existsSync(".next/BUILD_ID");

const webServerCommand = isCI
  ? "npm run build && npm run start -- -p 3000"
  : hasNextBuild
    ? "npm run start -- -p 3000"
    : "npm run dev -- --port 3000";

export default defineConfig({
  testDir: "./src/e2e",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: webServerCommand,
    url: "http://localhost:3000",
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
