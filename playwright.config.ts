import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Playwright does not load .env / .env.local; load them so E2E_* and DB env match local runs.
loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

/** When `DATABASE_URL_TEST` is set, the spawned `pnpm start` gets that value as `DATABASE_URL` (isolated test DB). */
const databaseUrlForWebServer =
  process.env.DATABASE_URL_TEST?.trim() ||
  process.env.DATABASE_URL_LOCAL?.trim() ||
  process.env.DATABASE_URL ||
  "";

/**
 * Dedicated port avoids `reuseExistingServer` attaching to `next dev` on :3000 (different
 * behavior than production). Override with PLAYWRIGHT_TEST_PORT or PLAYWRIGHT_BASE_URL.
 * If auth redirects misbehave locally, run `pnpm build` with NEXT_PUBLIC_APP_URL / BETTER_AUTH_URL
 * set to the same origin (e.g. http://127.0.0.1:3001) so client bundles match this port.
 */
const testPort = process.env.PLAYWRIGHT_TEST_PORT ?? "3001";
const testOrigin = `http://127.0.0.1:${testPort}`;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? testOrigin;
const isCI = Boolean(process.env.CI);
const shouldStartWebServer = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: shouldStartWebServer
    ? {
        command:
          "mkdir -p .next/standalone/.next && cp -R .next/static .next/standalone/.next/ && cp -R public .next/standalone/ && pnpm start",
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
        env: {
          ...process.env,
          PORT: testPort,
          NEXT_PUBLIC_APP_URL: testOrigin,
          BETTER_AUTH_URL: testOrigin,
          DATABASE_URL: databaseUrlForWebServer,
        },
      }
    : undefined,
});
