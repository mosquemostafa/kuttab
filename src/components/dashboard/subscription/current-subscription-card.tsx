"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useSubscription } from "@/components/subscription/subscription-provider";
import {
  PLAN_CONFIG,
  resolveEntitlementPlan,
} from "@/server/modules/subscriptions/subscription-entitlements";
import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";
import { apiClient } from "@/lib/api/api-client";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/format-money";

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

export function CurrentSubscriptionCard() {
  const locale = useLocale();
  const lang = locale === "ar" ? "ar" : "en";
  const t = useTranslations("dashboard.subscription");
  const { subscription, isSubscriptionLoading, mutateSubscription } =
    useSubscription();
  const [autoRenewUpdating, setAutoRenewUpdating] = useState(false);

  const entitlementPlan: SubscriptionPlanEnum = useMemo(
    () => resolveEntitlementPlan(subscription),
    [subscription],
  );

  const isEntitledFree = entitlementPlan === SubscriptionPlanEnum.FREE;
  const entitlementPlanConfig = PLAN_CONFIG[entitlementPlan];
  const entitlementPlanName = entitlementPlanConfig.displayName[lang];
  const entitlementPlanPrice =
    entitlementPlanConfig.price > 0
      ? formatMoney(
          entitlementPlanConfig.price,
          entitlementPlanConfig.currency,
          locale,
        )
      : t("freePrice");
  const activationDate = formatDate(subscription?.activatedAt, locale);
  const renewalDate = formatDate(subscription?.planExpiresAt, locale);

  async function toggleAutoRenew() {
    if (!subscription) return;

    setAutoRenewUpdating(true);

    try {
      if (subscription.autoRenew) {
        await apiClient.subscription.autoRenew();
      } else {
        await apiClient.subscription.resume();
      }

      await mutateSubscription();
      toast.success(t("autoRenewUpdated"));
    } catch {
      toast.error(t("autoRenewError"));
    } finally {
      setAutoRenewUpdating(false);
    }
  }

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader>
        <div className="flex min-w-0 gap-4">
          <div
            className="hidden size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary sm:flex"
            aria-hidden
          >
            <Sparkles className="size-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">{t("currentPlan")}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isSubscriptionLoading ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="h-4 w-2/3 rounded bg-muted/60" />
            <div className="h-4 w-1/2 rounded bg-muted/60" />
            <div className="h-4 w-3/4 rounded bg-muted/60" />
          </div>
        ) : (
          <>
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden>
                      {entitlementPlanConfig.emoji}
                    </span>
                    <p className="text-base font-semibold">
                      {entitlementPlanName}
                    </p>
                  </div>
                  <p className="text-sm text-foreground">
                    {entitlementPlanPrice}
                    {entitlementPlanConfig.renewalDays > 0 &&
                    entitlementPlan !== SubscriptionPlanEnum.FREE
                      ? ` / ${t("billingCycle", {
                          days: entitlementPlanConfig.renewalDays,
                        })}`
                      : ""}
                  </p>
                </div>
              </div>
            </div>

            {!isEntitledFree ? (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/20 px-2.5 py-2">
                    <p className="text-xs text-muted-foreground">
                      {t("activatedAtLabel")}
                    </p>
                    <p className="mt-0.5 text-sm font-medium">
                      {activationDate}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 px-2.5 py-2">
                    <p className="text-xs text-muted-foreground">
                      {t("renewsAtLabel")}
                    </p>
                    <p className="mt-0.5 text-sm font-medium">
                      {subscription?.planExpiresAt
                        ? renewalDate
                        : t("expiresNever")}
                    </p>
                  </div>
                </div>

                {subscription ? (
                  <div className="rounded-lg border px-3 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">
                          {t("autoRenewTitle")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {subscription.autoRenew
                            ? t("autoRenewOn")
                            : t("autoRenewOff")}
                        </p>
                      </div>
                      <Switch
                        checked={subscription.autoRenew}
                        onCheckedChange={() => {
                          void toggleAutoRenew();
                        }}
                        disabled={autoRenewUpdating}
                        aria-label={t("autoRenewTitle")}
                      />
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {isEntitledFree ? (
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      {t("upgradeCtaTitle")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("upgradeCtaDescription")}
                    </p>
                  </div>
                  <Button
                    asChild
                    className="w-full sm:w-auto"
                    variant="default"
                    size="sm"
                  >
                    <Link href="/dashboard/subscription#subscription-plans">
                      {t("upgradeCta")}
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}

            {entitlementPlan === SubscriptionPlanEnum.TRIAL ? (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      {t("trialLimitsNoticeTitle")}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t("trialLimitsNoticeDescription")}
                    </p>
                  </div>
                  <Button
                    asChild
                    className="w-full shrink-0 sm:w-auto"
                    variant="default"
                    size="sm"
                  >
                    <Link href="/dashboard/subscription/checkout">
                      {t("upgradeToCheckoutCta")}
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
