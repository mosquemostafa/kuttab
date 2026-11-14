"use client";

import * as Sentry from "@sentry/nextjs";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Home, RefreshCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClearDataButton } from "@/components/ClearDataButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const t = useTranslations("common.error");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <Card className="w-full max-w-xl border-border/60 bg-card/90 backdrop-blur-sm">
        <CardHeader className="flex flex-col items-center text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-destructive/40 bg-destructive/10 text-destructive">
            <TriangleAlert className="h-6 w-6 mx-auto" />
          </div>
          <CardTitle className="mt-4 text-2xl tracking-tight sm:text-3xl">
            {t("title")}
          </CardTitle>
          <CardDescription className="mx-auto mt-2 max-w-md text-balance">
            {t("description")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            {error.message || t("fallbackMessage")}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
          <Button
            onClick={() => reset()}
            className="inline-flex items-center gap-2"
          >
            <RefreshCcw data-icon="inline-start" />
            {t("retry")}
          </Button>
          <Button asChild variant="outline">
            <Link href="/" className="inline-flex items-center gap-2">
              <Home data-icon="inline-start" />
              {t("goHome")}
            </Link>
          </Button>
          <ClearDataButton />
        </CardFooter>
      </Card>
    </main>
  );
}
