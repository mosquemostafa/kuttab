import { expect, test } from "@playwright/test";

/**
 * Production-style smoke: verifies app boot, locale routing, and login.
 * Run via `pnpm test:smoke` (`--grep @smoke`). Requires E2E credentials.
 */
const smokeEmail = process.env.E2E_USER_EMAIL;
const smokePassword = process.env.E2E_USER_PASSWORD;

test.describe("smoke", () => {
  test.beforeEach(() => {
    test.skip(
      !smokeEmail || !smokePassword,
      "Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run smoke tests.",
    );
  });

  test(
    "API health, locale shell, login, dashboard",
    { tag: ["@smoke"] },
    async ({ page, request, baseURL }) => {
      await test.step("API health", async () => {
        const healthResponse = await request.get(`${baseURL}/api/health`);
        expect(healthResponse.ok()).toBeTruthy();
      });

      await test.step("English locale redirect to login", async () => {
        await page.goto("/en");
        await expect(page).toHaveURL(/\/en\/auth\/login/);
      });

      await test.step("Email login", async () => {
        await page.goto("/en/auth/login", { waitUntil: "networkidle" });
        const loginButton = page.getByRole("button", { name: "Login" });
        await expect(loginButton).toBeVisible();

        const emailField = page.getByRole("textbox", { name: "Email" });
        const passwordField = page.getByRole("textbox", { name: "Password" });
        await emailField.fill(smokeEmail!);
        await passwordField.fill(smokePassword!);
        await expect(emailField).toHaveValue(smokeEmail!);
        await expect(passwordField).toHaveValue(smokePassword!);

        await Promise.all([
          page.waitForURL(/\/en\/dashboard(\/overview)?/, {
            waitUntil: "commit",
          }),
          loginButton.click(),
        ]);
      });
    },
  );
});
