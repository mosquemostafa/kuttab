"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { Link } from "@/i18n/navigation";
import { isApiClientError } from "@/lib/api/api-error";
import { apiClient } from "@/lib/api/api-client";
import { useSubscription } from "@/components/subscription/subscription-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrialStart() {
  const t = useTranslations("dashboard.trial");
  const { subscription, isSubscriptionLoading, mutateSubscription } =
    useSubscription();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const trialAlreadyUsed = subscription?.trialUsed === true;

  async function handleStartTrial() {
    setIsSubmitting(true);

    try {
      const result = await apiClient.subscription.startTrial();

      if (result.started) {
        await mutateSubscription();
        toast.success(t("success"));
      } else {
        toast.error(t("errorFallback"));
      }
    } catch (e) {
      if (isApiClientError(e)) {
        toast.error(e.message || t("errorFallback"));
      } else {
        toast.error(t("errorFallback"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {isSubscriptionLoading ? (
        <Card>
          <p className="sr-only">{t("loadingSubscription")}</p>
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-40" />
          </CardFooter>
        </Card>
      ) : trialAlreadyUsed ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("trialUsedTitle")}</CardTitle>
            <CardDescription>{t("trialUsedDescription")}</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/dashboard/subscription/checkout">
                {t("subscribeNow")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/subscription">
                {t("viewSubscription")}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("cardTitle")}</CardTitle>
            <CardDescription>{t("cardDescription")}</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            <ul className="flex list-disc flex-col gap-2 ps-6 text-sm text-muted-foreground">
              <li>{t("noteOne")}</li>
              <li>{t("noteTwo")}</li>
              <li>{t("noteThree")}</li>
              <li>{t("noteFour")}</li>
            </ul>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={handleStartTrial}
              disabled={isSubmitting}
            >
              {isSubmitting ? t("starting") : t("startCta")}
            </Button>

            <Button asChild variant="secondary">
              <Link href="/dashboard/subscription/checkout">
                {t("skipTrialCta")}
              </Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/dashboard/subscription">
                {t("viewSubscription")}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
