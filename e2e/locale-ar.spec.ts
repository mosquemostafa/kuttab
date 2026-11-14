import { expect, test } from "@playwright/test";

test.describe("@i18n Arabic login locale", () => {
  test("login page shows Arabic form labels and auth links", async ({
    page,
  }) => {
    await page.goto("/ar/auth/login", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/ar\/auth\/login$/);

    await expect(
      page.getByRole("textbox", { name: "البريد الإلكتروني" }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "كلمة المرور" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "تسجيل الدخول" }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "هل نسيت كلمة المرور؟" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "أنشئ حسابًا" })).toBeVisible();
  });

  test("wrong password shows Arabic invalid credentials message", async ({
    page,
  }) => {
    const smokeEmail = process.env.E2E_USER_EMAIL;
    test.skip(
      !smokeEmail,
      "Set E2E_USER_EMAIL (and E2E_USER_PASSWORD for other suites).",
    );

    await page.goto("/ar/auth/login", { waitUntil: "networkidle" });
    await page
      .getByRole("textbox", { name: "البريد الإلكتروني" })
      .fill(smokeEmail!);
    await page
      .getByRole("textbox", { name: "كلمة المرور" })
      .fill("not-the-password");
    await page.getByRole("button", { name: "تسجيل الدخول" }).click();

    const invalidCreds = page.getByText(
      "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      {
        exact: true,
      },
    );
    const rateLimited = page.getByText(/Too many (attempts|requests)/i);

    await expect(invalidCreds.or(rateLimited)).toBeVisible();
  });
});
