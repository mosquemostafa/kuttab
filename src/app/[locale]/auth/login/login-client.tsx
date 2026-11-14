"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/auth/login-form";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleIcon, GithubIcon } from "@/components/ui/icons";
import { signInWithGithub, signInWithGoogle } from "@/lib/auth-client";
import { sanitizeInternalCallbackPath } from "@/lib/auth/safe-callback-url";
import { Logo } from "@/components/landing/logo";

function LoginWithCallback() {
  const searchParams = useSearchParams();
  const redirectAfterLogin = sanitizeInternalCallbackPath(
    searchParams.get("callbackUrl"),
  );

  return (
    <>
      <LoginForm redirectAfterLogin={redirectAfterLogin} />
      <div className="my-2 flex items-center">
        <div className="h-px flex-1 bg-muted-foreground/30" />
        <span className="mx-3 text-xs font-medium text-muted-foreground">
          OR
        </span>
        <div className="h-px flex-1 bg-muted-foreground/30" />
      </div>
      <div className="flex w-full flex-row gap-2">
        <Button
          variant="outline"
          className="flex w-1/2 cursor-pointer items-center justify-center"
          type="button"
          onClick={() => void signInWithGoogle(redirectAfterLogin)}
        >
          <GoogleIcon className="mr-2" />
          Google
        </Button>
        <Button
          variant="outline"
          className="flex w-1/2 cursor-pointer items-center justify-center"
          type="button"
          onClick={() => void signInWithGithub(redirectAfterLogin)}
        >
          <GithubIcon className="mr-2" />
          GitHub
        </Button>
      </div>
    </>
  );
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
