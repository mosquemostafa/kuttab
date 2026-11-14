"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  Check,
  Crown,
  Gem,
  LucideIcon,
  Sparkles,
  X,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format-money";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";
import type { PlanFeatures } from "@/shared/types/subscription.types";

export type PlanFeatureRowModel = {
  label: string;
  included: boolean;
};

export type PlanFeatureSectionModel = {
  title: string;
  rows: PlanFeatureRowModel[];
};

export type DashboardPlanCardModel = {
  id: SubscriptionPlanEnum;
  /**
   * Kept optional for backward compatibility with older payloads.
   */
  emoji: string;
  name: string;
  price: number;
  currency: string;
  renewalDays: number;
  highlight: boolean;
  sections: PlanFeatureSectionModel[];
  primaryCta: "free" | "tryFree" | "business";
  /**
   * Optional entitlement info.
   * Some older plan-card variants read `maxHabits` directly.
   */
  features?: PlanFeatures;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const PRO_YEARLY_PRICE = 360;
const PRO_MONTHLY_PRICE = 50;
const PRO_ANNUAL_REGULAR_PRICE = PRO_MONTHLY_PRICE * 12; // 600
const PRO_YEARLY_SAVINGS_PERCENT = 40;
const PRO_YEARLY_MONTHLY_EQUIVALENT = 30;

type BillingCycle = "monthly" | "yearly";

function toLocalCalendarDayUtcMs(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateInput(value: string) {
  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.exec(value);
  if (dateOnlyMatch) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

function getDaysLeft(value: string | null | undefined) {
  if (!value) return null;
  const expiresAt = parseDateInput(value);
  if (Number.isNaN(expiresAt.getTime())) return null;

  const todayUtcMs = toLocalCalendarDayUtcMs(new Date());
  const expiryUtcMs = toLocalCalendarDayUtcMs(expiresAt);
  const rawDaysLeft = Math.round((expiryUtcMs - todayUtcMs) / MS_PER_DAY);
  return Math.max(0, rawDaysLeft);
}

const PLAN_ICON_BY_ID: Record<SubscriptionPlanEnum, LucideIcon> = {
  [SubscriptionPlanEnum.FREE]: Crown,
  [SubscriptionPlanEnum.TRIAL]: Crown,
  [SubscriptionPlanEnum.PRO]: Gem,
};

type DashboardPlansClientProps = {
  plans: DashboardPlanCardModel[];
  tryFreeDays: number;
  isTrialAvailable?: boolean;
  currentPlan?: SubscriptionPlanEnum;
  currentPlanText?: string;
  currentPlanExpiresAt?: string | null;
  defaultBillingCycle?: BillingCycle;
};

export function DashboardPlans({
  plans,
  tryFreeDays,
  isTrialAvailable = false,
  currentPlan,
  currentPlanText = "Current plan",
  currentPlanExpiresAt,
  defaultBillingCycle = "yearly",
}: DashboardPlansClientProps) {
  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>(defaultBillingCycle);
  const t = useTranslations("dashboard.plans");
  const locale = useLocale();
  const effectiveCurrentPlan =
    currentPlan === SubscriptionPlanEnum.TRIAL
      ? SubscriptionPlanEnum.PRO
      : currentPlan;

  const isYearly = billingCycle === "yearly";

  return (
    <div className="space-y-6">
      {/* Billing Cycle Switcher with Savings Encouragement */}
      <div className="flex flex-col items-center justify-center gap-3">
        <div
          role="radiogroup"
          aria-label={t("billingCycleAria")}
          className="inline-flex items-center rounded-full border border-border/80 bg-muted/60 p-1 shadow-xs backdrop-blur-xs"
        >
          <button
            type="button"
            role="radio"
            aria-checked={billingCycle === "monthly"}
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 select-none",
              billingCycle === "monthly"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("billingMonthly")}
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={billingCycle === "yearly"}
            onClick={() => setBillingCycle("yearly")}
            className={cn(
              "relative cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 select-none inline-flex items-center gap-1.5",
              billingCycle === "yearly"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{t("billingYearly")}</span>
          </button>
        </div>

        {/* Dynamic encouragement callout under toggle */}
        <div className="flex items-center justify-center text-xs font-medium transition-all">
          {isYearly ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-emerald-800 dark:text-emerald-200">
              <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {t("yearlyEncouragementActive")}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <Sparkles className="size-3.5 text-primary shrink-0" />
              {t("yearlyEncouragementPrompt")}
            </button>
          )}
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6"
        role="list"
        aria-label={t("chooseAria")}
      >
        {plans.map((plan) => {
          const isPro = plan.id === SubscriptionPlanEnum.PRO;
          const PlanIcon = PLAN_ICON_BY_ID[plan.id] ?? Crown;
          const isCurrentPlan = effectiveCurrentPlan === plan.id;
          const isCurrentPlanActive =
            isCurrentPlan && currentPlan !== SubscriptionPlanEnum.TRIAL;
          const currentPlanDaysLeft = getDaysLeft(currentPlanExpiresAt);
          const shouldShowPlanExpiresAtBadge =
            isCurrentPlan &&
            effectiveCurrentPlan !== SubscriptionPlanEnum.FREE &&
            currentPlanDaysLeft != null;
          const shouldUseTrialCta =
            !isCurrentPlan && isTrialAvailable && plan.primaryCta === "tryFree";

          const checkoutHref = isYearly
            ? "/dashboard/subscription/checkout?cycle=yearly"
            : "/dashboard/subscription/checkout?cycle=monthly";

          const ctaHref = isTrialAvailable
            ? "/dashboard/subscription/trial"
            : checkoutHref;

          const yearlyCtaLabel = isCurrentPlanActive
            ? t("ctaExtendYearlyPro")
            : currentPlan === SubscriptionPlanEnum.TRIAL
              ? t("ctaUpgradeToYearlyPro")
              : shouldUseTrialCta
                ? t("ctaTryFree")
                : t("ctaSubscribeYearly");

          const monthlyCtaLabel = isCurrentPlanActive
            ? t("ctaExtendPro")
            : currentPlan === SubscriptionPlanEnum.TRIAL
              ? t("ctaUpgradeToPro")
              : shouldUseTrialCta
                ? t("ctaTryFree")
                : t("ctaSubscribePro");

          const ctaLabel = isPro
            ? isYearly
              ? yearlyCtaLabel
              : monthlyCtaLabel
            : plan.primaryCta === "business"
              ? t("ctaBusiness")
              : t("freePlanPrice");

          return (
            <Card
              key={plan.id}
              role="listitem"
              size="sm"
              aria-current={isCurrentPlan ? "true" : undefined}
              className={cn(
                "relative min-w-0 transition-all duration-200",
                isCurrentPlan && "border-primary bg-primary/5 shadow-sm",
                plan.highlight &&
                  !isCurrentPlan &&
                  isYearly &&
                  "border-primary/80 ring-2 ring-primary/20 shadow-md bg-gradient-to-b from-card via-card to-primary/[0.03]",
                plan.highlight &&
                  !isCurrentPlan &&
                  !isYearly &&
                  "border-primary shadow-sm",
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {plan.id !== SubscriptionPlanEnum.FREE ? (
                    <span
                      className="inline-flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground"
                      aria-hidden
                    >
                      <PlanIcon className="size-4" />
                    </span>
                  ) : null}
                  <CardTitle className="text-lg leading-tight">
                    {plan.name}
                  </CardTitle>
                  {isCurrentPlan ? (
                    <span className="ms-auto inline-flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {currentPlan === SubscriptionPlanEnum.TRIAL ? (
                          <>
                            <span aria-hidden>🎁 </span>
                            {currentPlanText}
                          </>
                        ) : (
                          currentPlanText
                        )}
                      </span>
                    </span>
                  ) : isYearly && isPro ? (
                    <span className="ms-auto inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500/15 to-primary/15 border border-emerald-500/25 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
                      {t("bestValueBadge")}
                    </span>
                  ) : null}
                </div>
                <CardDescription>
                  {plan.id === SubscriptionPlanEnum.FREE && t("taglineFree")}
                  {plan.id === SubscriptionPlanEnum.PRO && t("taglinePro")}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-6">
                {isCurrentPlan &&
                currentPlan === SubscriptionPlanEnum.TRIAL &&
                plan.id === SubscriptionPlanEnum.PRO ? (
                  <div
                    role="status"
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertCircle
                        className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                        aria-hidden
                      />
                      <div className="space-y-1">
                        <p className="font-semibold text-amber-900 dark:text-amber-200">
                          {t("trialLimitsNoticeTitle")}
                        </p>
                        <p className="leading-relaxed text-amber-800/90 dark:text-amber-200/90">
                          {t("trialLimitsNoticeDescription")}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {plan.sections.map((section, sIdx) => (
                  <div key={`${plan.id}-section-${sIdx}`} className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.title}
                    </p>
                    <ul className="flex flex-col gap-2 text-sm">
                      {section.rows.map((row) => (
                        <li
                          key={`${plan.id}-${row.label}`}
                          className="flex items-start gap-2"
                        >
                          <FeatureIcon included={row.included} />
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="leading-snug">{row.label}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>

              <CardFooter className="mt-auto flex flex-col items-start gap-3">
                {plan.price === 0 ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-xl font-semibold tracking-tight">
                      {t("freePlanPrice")}
                    </p>
                  </div>
                ) : isYearly && isPro ? (
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="text-2xl font-bold tracking-tight text-foreground">
                        {formatMoney(PRO_YEARLY_PRICE, plan.currency, locale)}
                      </p>
                      <p className="text-sm text-muted-foreground line-through decoration-muted-foreground/60">
                        {formatMoney(
                          PRO_ANNUAL_REGULAR_PRICE,
                          plan.currency,
                          locale,
                        )}
                      </p>
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        {t("savePercentBadge", {
                          percent: PRO_YEARLY_SAVINGS_PERCENT,
                        })}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground/80">
                        {t("cadencePaidYearly")}
                      </p>
                      <p className="text-muted-foreground">
                        {t("monthlyEquivalentHint", {
                          price: formatMoney(
                            PRO_YEARLY_MONTHLY_EQUIVALENT,
                            plan.currency,
                            locale,
                          ),
                        })}
                      </p>
                    </div>
                    {shouldUseTrialCta && !isCurrentPlan ? (
                      <p className="text-xs font-medium text-primary">
                        {t("tryFreeOnPro", { days: tryFreeDays })}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <p className="text-xl font-semibold tracking-tight">
                      {formatMoney(plan.price, plan.currency, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("cadencePaid", { days: plan.renewalDays })}
                    </p>
                    {isPro && shouldUseTrialCta && !isCurrentPlan ? (
                      <p className="text-xs font-medium text-primary">
                        {t("tryFreeOnPro", { days: tryFreeDays })}
                      </p>
                    ) : null}
                  </div>
                )}

                {plan.id !== SubscriptionPlanEnum.FREE ? (
                  <div className="flex w-full flex-col gap-2">
                    <Link
                      href={
                        currentPlan === SubscriptionPlanEnum.TRIAL ||
                        isCurrentPlan
                          ? checkoutHref
                          : ctaHref
                      }
                      data-slot="button"
                      data-variant={
                        currentPlan === SubscriptionPlanEnum.TRIAL ||
                        isCurrentPlan
                          ? "default"
                          : plan.highlight
                            ? "default"
                            : "outline"
                      }
                      data-size="default"
                      className={cn(
                        buttonVariants({
                          variant:
                            currentPlan === SubscriptionPlanEnum.TRIAL ||
                            isCurrentPlan
                              ? "default"
                              : plan.highlight
                                ? "default"
                                : "outline",
                        }),
                        "w-full cursor-pointer",
                        isYearly && isPro && "shadow-sm font-semibold",
                      )}
                    >
                      {isYearly && isPro && !shouldUseTrialCta && (
                        <Sparkles className="size-4 shrink-0 me-1.5" />
                      )}
                      {ctaLabel}
                    </Link>

                    {isPro && shouldUseTrialCta && !isCurrentPlan ? (
                      <Link
                        href={checkoutHref}
                        className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        {isYearly
                          ? t("ctaSkipTrialAndSubscribeYearly")
                          : t("ctaSkipTrialAndSubscribe")}
                      </Link>
                    ) : null}
                  </div>
                ) : null}

                {shouldShowPlanExpiresAtBadge ? (
                  <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    {t("expiresInBadge", { days: currentPlanDaysLeft })}
                  </span>
                ) : null}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function FeatureIcon({ included }: { included: boolean }) {
  return (
    <span className="mt-0.5 shrink-0" aria-hidden>
      {included ? (
        <Check
          className="size-3 text-emerald-600 sm:size-4"
          strokeWidth={2.5}
        />
      ) : (
        <X
          className="size-3 text-muted-foreground/65 sm:size-4"
          strokeWidth={2}
        />
      )}
    </span>
  );
}
