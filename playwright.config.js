import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:3001",
    headless: true,
    launchOptions: {
      executablePath:
        process.env.CHROMIUM_PATH === "bundled"
          ? undefined
          : process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: `PORT=3001 DATA_DIR=.data/e2e-${process.pid} NODE_ENV=test node server/index.js`,
    url: "http://127.0.0.1:3001/api/health",
    reuseExistingServer: false,
    timeout: 30000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
