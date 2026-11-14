import { expect, test } from "@playwright/test";

const smokeEmail = process.env.E2E_USER_EMAIL;
const smokePassword = process.env.E2E_USER_PASSWORD;

test.describe("@auth edge cases", () => {
  // Serial: several tests hit login; avoids racing the same Redis IP/email keys as the rate-limit loop.
  test.describe.configure({ mode: "serial" });

  test("wrong password shows invalid credentials (en)", async ({ page }) => {
    test.skip(
      !smokeEmail || !smokePassword,
      "Set E2E_USER_EMAIL and E2E_USER_PASSWORD.",
    );

    await page.goto("/en/auth/login", { waitUntil: "networkidle" });
    await page.getByRole("textbox", { name: "Email" }).fill(smokeEmail!);
    await page
      .getByRole("textbox", { name: "Password" })
      .fill("definitely-not-the-password");
    await page.getByRole("button", { name: "Login" }).click();

    const invalidCreds = page.getByText("Invalid email or password.", {
      exact: true,
    });
    const rateLimited = page.getByText(/Too many (attempts|requests)/i);

    await expect(invalidCreds.or(rateLimited)).toBeVisible();
  });

  test("login rate limit after repeated failures (en)", async ({ page }) => {
    test.skip(
      !smokeEmail || !smokePassword,
      "Set E2E_USER_EMAIL and E2E_USER_PASSWORD.",
    );
    test.skip(
      !process.env.UPSTASH_REDIS_REST_URL?.trim() ||
        !process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN required (login limiter is a no-op without Redis).",
    );

    test.slow();

    await page.goto("/en/auth/login", { waitUntil: "networkidle" });
    const email = page.getByRole("textbox", { name: "Email" });
    const password = page.getByRole("textbox", { name: "Password" });
    const submit = page.getByRole("button", { name: "Login" });

    const invalidCreds = page.getByText("Invalid email or password.", {
      exact: true,
    });
    const rateLimited = page.getByText(/Too many (attempts|requests)/i);

    for (let i = 0; i < 5; i += 1) {
      await email.fill(smokeEmail!);
      await password.fill(`wrong-password-attempt-${i}`);
      await submit.click();
      // Other workers (smoke, locale) share the same IP limiter key; we may hit "Too many attempts"
      // before five invalid-credential rounds complete. Either outcome proves the UI surfaced an error.
      await expect(invalidCreds.or(rateLimited)).toBeVisible();
      if (await rateLimited.isVisible()) {
        await expect(rateLimited).toBeVisible();
        return;
      }
      await expect(invalidCreds).toBeVisible();
    }

    await email.fill(smokeEmail!);
    await password.fill("wrong-password-final");
    await submit.click();
    await expect(rateLimited).toBeVisible();
  });

  test("OAuth entry: Google navigates toward provider or auth API", async ({
    page,
    context,
  }) => {
    await page.goto("/en/auth/login", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "GitHub" })).toBeVisible();

    const popupPromise = context
      .waitForEvent("page", { timeout: 3_000 })
      .catch(() => null);
    await page.getByRole("button", { name: "Google" }).click();

    const popup = await popupPromise;
    if (popup) {
      await popup.waitForURL(/google\.|accounts\.google|\/api\/auth\//, {
        timeout: 20_000,
      });
      await popup.close();
      return;
    }

    await page.waitForURL(/google\.|accounts\.google|\/api\/auth\//, {
      timeout: 20_000,
    });
  });

  test("clear-stale-session redirects to safe internal path", async ({
    page,
  }) => {
    const target = "/en/auth/login";
    await page.goto(
      `/api/auth/clear-stale-session?redirect=${encodeURIComponent(target)}`,
    );
    await expect(page).toHaveURL(new RegExp(`${target.replace("/", "\\/")}$`));
  });
});
