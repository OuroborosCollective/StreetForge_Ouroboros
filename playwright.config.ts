import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
    headless: true,
    browserName: "chromium",
    launchOptions: { executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium", args: ["--no-sandbox", "--disable-dev-shm-usage"] },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
