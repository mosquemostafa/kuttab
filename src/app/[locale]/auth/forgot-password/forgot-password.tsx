"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/landing/logo";

import ForgotPasswordForm from "@/components/auth/forgot-password-form";
import { Card, CardContent } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgot.page");

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
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
