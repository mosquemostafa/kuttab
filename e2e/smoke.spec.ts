import { expect, test } from "@playwright/test";

/**
 * Production-style smoke: one short path that proves the app boots, auth works, and a
 * write succeeds. Run via `pnpm test:smoke` (`--grep @smoke`). Requires E2E credentials.
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
    "API health, locale shell, login, dashboard, create todo, bearer auth",
    { tag: ["@smoke"] },
    async ({ page, request, playwright, baseURL }) => {
      await test.step("API health", async () => {
        const healthResponse = await request.get(`${baseURL}/api/health`);
        expect(healthResponse.ok()).toBeTruthy();
      });

      await test.step("English locale landing", async () => {
        await page.goto("/en");
        await expect(page).toHaveURL(/\/en\/?$/);
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

      await test.step("Create todo", async () => {
        await page.goto("/en/dashboard/todos");
        const todoTitle = `Smoke todo ${Date.now()}`;
        const quickCreateInput = page.locator("form textarea").first();
        await expect(quickCreateInput).toBeVisible();
        await quickCreateInput.fill(todoTitle);
        await quickCreateInput.press("Enter");
        await expect(page.getByText(todoTitle).first()).toBeVisible();
      });

      await test.step("Bearer token API authentication", async () => {
        const cookies = await page.context().cookies();
        const sessionCookie = cookies.find((c) =>
          c.name.includes("session_token"),
        );
        expect(sessionCookie?.value).toBeTruthy();

        // Query protected endpoint without any cookies using Bearer token
        const noCookieClient = await playwright.request.newContext({ baseURL });
        const todosRes = await noCookieClient.get("/api/todos", {
          headers: {
            Authorization: `Bearer ${sessionCookie!.value}`,
          },
        });
        expect(todosRes.ok()).toBeTruthy();
        const todosData = await todosRes.json();
        expect(todosData).toHaveProperty("data");

        await noCookieClient.dispose();
      });
    },
  );
});
