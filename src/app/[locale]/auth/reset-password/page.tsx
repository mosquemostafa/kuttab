import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/landing/logo";

import ResetPasswordForm from "@/components/auth/reset-password-form";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "metadata",
  });

  const title = t("auth.resetPassword.title");
  const description = t("auth.resetPassword.description");

  return {
    title,
    description,
    keywords: ["reset password", "token", "authentication"],
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const t = await getTranslations("auth.reset.page");
  const params = await searchParams;
  const token = params.token;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground mx-2">
      <div className="flex flex-col items-center w-full max-w-md gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <Logo size="sm" />
          {t("brandName")}
        </Link>

        <Card className="w-full">
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="space-y-1 text-center">
              <h1 className="text-xl font-semibold">{t("title")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("description")}
              </p>
            </div>

            {!token ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {t("invalidToken")}
              </div>
            ) : (
              <ResetPasswordForm token={token} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
