"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import {
  DashboardPlans,
  type DashboardPlanCardModel,
} from "@/components/dashboard/dashboard-plans";
import { SubscriptionInvoicesTable } from "./subscription-invoices-table";
import { useSubscription } from "@/components/subscription/subscription-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { resolveEntitlementPlan } from "@/server/modules/subscriptions/subscription-entitlements";
import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";
import type { InvoiceDTO } from "@/shared/types/subscription.types";
import { apiClient } from "@/lib/api/api-client";

type SubscriptionPageClientProps = {
  plans: DashboardPlanCardModel[];
  tryFreeDays: number;
};

export default function SubscriptionPage({
  plans,
  tryFreeDays,
}: SubscriptionPageClientProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");

  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { subscription, isSubscriptionLoading } = useSubscription();
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingInvoices(true);
      setError(null);

      try {
        const currentInvoices = await apiClient.subscription.listInvoices();

        if (!cancelled) {
          setInvoices(currentInvoices ?? []);
        }
      } catch {
        if (!cancelled) setError(t("subscription.error"));
      } finally {
        if (!cancelled) setLoadingInvoices(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const entitlementPlan = useMemo(
    () => resolveEntitlementPlan(subscription),
    [subscription],
  );
  const isTrialAvailable =
    !isSubscriptionLoading && (subscription == null || !subscription.trialUsed);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {error ? (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t("subscription.loadingErrorTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-6">
        <section id="subscription-plans" className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {t("plans.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("plans.subtitle")}
            </p>
          </div>

          <DashboardPlans
            plans={plans}
            tryFreeDays={tryFreeDays}
            isTrialAvailable={isTrialAvailable}
            currentPlan={entitlementPlan}
            currentPlanText={
              entitlementPlan === SubscriptionPlanEnum.TRIAL
                ? t("subscription.trialPlanBadge")
                : t("subscription.currentPlanBadge")
            }
            currentPlanExpiresAt={subscription?.planExpiresAt}
          />
        </section>

        <SubscriptionInvoicesTable
          invoices={invoices}
          isLoading={loadingInvoices}
          locale={locale}
        />
      </div>
    </div>
  );
}
