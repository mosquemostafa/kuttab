import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import {
  PLAN_CONFIG,
  PLAN_FEATURES,
} from "@/server/modules/subscriptions/subscription-entitlements";
import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";
import SubscriptionPage from "@/components/dashboard/subscription/subscription-page";
import type { DashboardPlanCardModel } from "@/components/dashboard/dashboard-plans";

const PLAN_ORDER: SubscriptionPlanEnum[] = [
  SubscriptionPlanEnum.FREE,
  SubscriptionPlanEnum.PRO,
];

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

  const title = t("dashboard.subscription.title");
  const description = t("dashboard.subscription.description");

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

export default async function DashboardSubscriptionPage() {
  const t = await getTranslations("dashboard.plans");
  const locale = await getLocale();
  const lang = locale === "ar" ? "ar" : "en";

  const tryFreeDays = PLAN_CONFIG[SubscriptionPlanEnum.TRIAL].renewalDays;

  const plans: DashboardPlanCardModel[] = PLAN_ORDER.flatMap((id) => {
    const config = PLAN_CONFIG[id];
    if (!config) {
      return [];
    }

    const primaryCta =
      id === SubscriptionPlanEnum.FREE
        ? "free"
        : id === SubscriptionPlanEnum.PRO
          ? "tryFree"
          : "business";

    const features = PLAN_FEATURES[id];

    const sections =
      id === SubscriptionPlanEnum.FREE
        ? [
            {
              title: t("sections.includes"),
              rows: [
                { label: t("features.free.tasks"), included: true },
                { label: t("features.free.stats"), included: true },
                { label: t("features.free.reminders"), included: true },
              ],
            },
            {
              title: t("sections.limits"),
              rows: [
                {
                  label: t("features.free.projects", {
                    count: features.maxProjects ?? 0,
                  }),
                  included: true,
                },
                {
                  label: t("features.free.tasks", {
                    count: features.maxTodos ?? 0,
                  }),
                  included: true,
                },
                {
                  label: t("features.free.editorImages", {
                    count: features.maxEditorImages ?? 0,
                  }),
                  included: true,
                },
              ],
            },
          ]
        : [
            {
              title: t("sections.proFeatures"),
              rows: [
                { label: t("features.pro.analytics"), included: true },
                { label: t("features.pro.export"), included: true },
                { label: t("features.pro.customization"), included: true },
              ],
            },
            {
              title: t("sections.unlimited"),
              rows: [
                {
                  label: t("features.pro.projectsUnlimited"),
                  included: true,
                },
              ],
            },
          ];

    return [
      {
        id,
        emoji: config.emoji,
        name: config.displayName[lang],
        price: config.price,
        currency: config.currency,
        renewalDays: config.renewalDays,
        highlight: id === SubscriptionPlanEnum.PRO,
        sections,
        features: PLAN_FEATURES[id],
        primaryCta,
      },
    ];
  });

  return <SubscriptionPage plans={plans} tryFreeDays={tryFreeDays} />;
}
