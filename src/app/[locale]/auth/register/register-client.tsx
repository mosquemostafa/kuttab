"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import RegisterForm from "@/components/auth/register-form";
import { Logo } from "@/components/logo";

export default function RegisterClientPage() {
  const t = useTranslations("auth.register.page");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground mx-2 ">
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
            <RegisterForm />
            <div className="text-center text-sm mt-4">
              {t("alreadyHaveAccount")}{" "}
              <Link
                href="/auth/login"
                className="text-primary underline hover:no-underline font-medium"
              >
                {t("login")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
