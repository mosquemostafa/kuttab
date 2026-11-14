import type {
  PlanFeatures,
  SubscriptionDTO,
} from "@/shared/types/subscription.types";
import { InvoiceCurrencyEnum } from "@/shared/enums/invoice-currency.enum";
import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";

export const PLAN_FEATURES: Record<SubscriptionPlanEnum, PlanFeatures> = {
  [SubscriptionPlanEnum.FREE]: {
    maxProjects: 3,
    maxTodos: 30,
    maxEditorImages: 20,
    analytics: false,
    csvExport: false,
  },
  [SubscriptionPlanEnum.TRIAL]: {
    maxProjects: 10,
    maxTodos: 100,
    maxEditorImages: 50,
    analytics: true,
    csvExport: true,
  },
  [SubscriptionPlanEnum.PRO]: {
    maxProjects: null,
    maxTodos: null,
    maxEditorImages: 100,
    analytics: true,
    csvExport: true,
  },
};

type PlanConfig = {
  price: number;
  currency: InvoiceCurrencyEnum;
  renewalDays: number;
  emoji: string;
  displayName: {
    ar: string;
    en: string;
  };
};

export const PLAN_CONFIG: Record<SubscriptionPlanEnum, PlanConfig> = {
  [SubscriptionPlanEnum.FREE]: {
    price: 0,
    currency: InvoiceCurrencyEnum.USD,
    renewalDays: 30,
    emoji: "🚀",
    displayName: {
      ar: "المجانية",
      en: "Free",
    },
  },
  [SubscriptionPlanEnum.TRIAL]: {
    price: 0,
    currency: InvoiceCurrencyEnum.USD,
    renewalDays: 14,
    emoji: "🎁",
    displayName: {
      ar: "التجربة",
      en: "Trial",
    },
  },
  [SubscriptionPlanEnum.PRO]: {
    price: 19,
    currency: InvoiceCurrencyEnum.USD,
    renewalDays: 30,
    emoji: "💎",
    displayName: {
      ar: "الاحترافية",
      en: "Pro",
    },
  },
};

export function resolveEntitlementPlan(
  subscription: SubscriptionDTO | null,
  now: Date = new Date(),
): SubscriptionPlanEnum {
  if (!subscription) {
    return SubscriptionPlanEnum.FREE;
  }

  const planExpiresAt = new Date(subscription.planExpiresAt);
  const hasActivePlanPeriod = planExpiresAt > now;

  if (hasActivePlanPeriod) {
    return subscription.plan;
  }

  return SubscriptionPlanEnum.FREE;
}
