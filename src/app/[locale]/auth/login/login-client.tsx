"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import LoginForm from "@/components/auth/login-form";
import { Card, CardContent } from "@/components/ui/card";
import { sanitizeInternalCallbackPath } from "@/lib/auth/safe-callback-url";
import { Logo } from "@/components/logo";

function LoginWithCallback() {
  const searchParams = useSearchParams();
  const redirectAfterLogin = sanitizeInternalCallbackPath(
    searchParams.get("callbackUrl"),
  );

  return <LoginForm redirectAfterLogin={redirectAfterLogin} />;
}

function LoginCardFallback() {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="h-40 animate-pulse rounded-md bg-muted" />
      </CardContent>
    </Card>
  );
}

export default function LoginClientPage() {
  const t = useTranslations("auth.login.page");

  return (
    <div className="mx-2 flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <Logo size="sm" />
          {t("brandName")}
        </Link>
        <Suspense fallback={<LoginCardFallback />}>
          <Card className="w-full">
            <CardContent className="flex flex-col gap-4 pt-6">
              <LoginWithCallback />
              <div className="mt-4 text-center text-sm">
                {t("notRegistered")}{" "}
                <Link
                  href="/auth/register"
                  className="font-medium text-primary underline hover:no-underline"
                >
                  {t("createAccount")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </Suspense>
      </div>
    </div>
  );
}
