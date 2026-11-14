import { PLAN_FEATURES } from "@/server/modules/subscriptions/subscription-entitlements";
import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";

type PlanFeatureRowConfig = {
  labelKey: string;
  labelParams?: Record<string, string | number>;
  included: boolean;
};

type PlanFeatureSectionConfig = {
  titleKey: string;
  rows: PlanFeatureRowConfig[];
};

export function buildFeatureSections(
  plan: SubscriptionPlanEnum,
): PlanFeatureSectionConfig[] {
  const features = PLAN_FEATURES[plan];

  if (plan === SubscriptionPlanEnum.FREE) {
    return [
      {
        titleKey: "sections.includes",
        rows: [
          { labelKey: "features.free.tasks", included: true },
          { labelKey: "features.free.stats", included: true },
        ],
      },
      {
        titleKey: "sections.limits",
        rows: [
          {
            labelKey: "features.free.projects",
            labelParams: { count: features.maxProjects ?? 0 },
            included: true,
          },
          {
            labelKey: "features.free.tasks",
            labelParams: { count: features.maxTodos ?? 0 },
            included: true,
          },
        ],
      },
    ];
  }

  return [
    {
      titleKey: "sections.proFeatures",
      rows: [
        { labelKey: "features.pro.analytics", included: true },
        { labelKey: "features.pro.export", included: true },
        { labelKey: "features.pro.customization", included: true },
      ],
    },
    {
      titleKey: "sections.unlimited",
      rows: [{ labelKey: "features.pro.projectsUnlimited", included: true }],
    },
  ];
}
