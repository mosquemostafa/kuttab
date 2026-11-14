import type { Metadata } from "next";
import { MessageCircle, Sparkles } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const WHATSAPP_NUMBER = "201003685977";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

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

  const title = t("dashboard.checkout.title");
  const description = t("dashboard.checkout.description");

  return {
    title,
    description,
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

type DashboardCheckoutPageProps = {
  searchParams?: Promise<{ cycle?: string; coupon?: string }>;
};

export default async function DashboardCheckoutPage({
  searchParams,
}: DashboardCheckoutPageProps) {
  const resolvedSearchParams = await searchParams;
  const cycle = resolvedSearchParams?.cycle;
  const isYearly = cycle === "yearly";
  const isMonthly = cycle === "monthly";
  const hasSelectedCycle = isYearly || isMonthly;

  const t = await getTranslations("dashboard.checkout");
  const locale = await getLocale();

  let whatsappUrl = WHATSAPP_URL;
  if (hasSelectedCycle) {
    const text = isYearly
      ? locale === "ar"
        ? "مرحبًا، أود الاشتراك في الباقة الاحترافية السنوية (360 ج.م - توفير 40%)"
        : "Hello, I would like to subscribe to the Pro Yearly plan (360 EGP - Save 40%)"
      : locale === "ar"
        ? "مرحبًا، أود الاشتراك في الباقة الاحترافية الشهرية (50 ج.م)"
        : "Hello, I would like to subscribe to the Pro Monthly plan (50 EGP)";
    whatsappUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("manualActivationTitle")}</CardTitle>
          <CardDescription>{t("manualActivationDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasSelectedCycle ? (
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("selectedPlanLabel")}
                </p>
                <p className="text-base font-semibold text-foreground">
                  {isYearly ? t("proYearlyTitle") : t("proMonthlyTitle")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isYearly
                    ? t("proYearlyPriceDesc")
                    : t("proMonthlyPriceDesc")}
                </p>
              </div>
              {isYearly ? (
                <span className="inline-flex w-fit items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300">
                  <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
                  {t("save35Badge")}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{t("step1")}</p>
            <p>{t("step2")}</p>
            <p>{t("step3")}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="sm:w-auto">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2"
              >
                <MessageCircle className="size-5" aria-hidden />
                {t("contactWhatsapp")}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
