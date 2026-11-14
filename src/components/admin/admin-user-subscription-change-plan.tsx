"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import type { SubscriptionDTO } from "@/shared/types/subscription.types";

type AdminUserSubscriptionChangePlanProps = {
  subscription: SubscriptionDTO | null;
  loading: boolean;
  loadFailed: boolean;
  onActionCompleted?: () => Promise<void>;
};

const PLAN_OPTIONS = ["pro", "business"] as const;
const PAYMENT_METHOD_OPTIONS = [
  "gateway",
  "bank_transfer",
  "vodafone_cash",
  "instapay",
  "complimentary",
  "fix",
] as const;

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function AdminUserSubscriptionChangePlan({
  subscription,
  loading,
  loadFailed,
  onActionCompleted,
}: AdminUserSubscriptionChangePlanProps) {
  const t = useTranslations("adminUsers");
  const locale = useLocale();

  const [plan, setPlan] = useState<(typeof PLAN_OPTIONS)[number]>("pro");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof PAYMENT_METHOD_OPTIONS)[number]>("gateway");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    fromPlan: string;
    toPlan: string;
    planExpiresAt: string;
    eventId: string | null;
    invoiceId: string | null;
  } | null>(null);

  useEffect(() => {
    if (subscription?.plan === "pro") {
      setPlan("business");
    } else {
      setPlan("pro");
    }
  }, [subscription?.plan]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!subscription) {
      setError(t("subscriptionChangePlan.noSubscription"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiClient.adminSubscriptions.changePlan(
        subscription.id,
        {
          plan,
          notes: notes.trim() || undefined,
          paymentMethod,
        },
      );

      setSuccess({
        fromPlan: result.fromPlan,
        toPlan: result.toPlan,
        planExpiresAt: result.planExpiresAt,
        eventId: result.eventId,
        invoiceId: result.invoiceId,
      });
      await onActionCompleted?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("subscriptionChangePlan.submitFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-1 text-base font-semibold">
        {t("subscriptionChangePlan.title")}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("subscriptionChangePlan.description")}
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionChangePlan.loading")}
        </p>
      ) : loadFailed ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionChangePlan.loadFailed")}
        </p>
      ) : !subscription ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionChangePlan.noSubscription")}
        </p>
      ) : (
        <form className="grid gap-3" onSubmit={onSubmit}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1">
              <label
                className="text-sm font-medium"
                htmlFor="change-plan-current-plan"
              >
                {t("subscriptionChangePlan.currentPlan")}
              </label>
              <input
                id="change-plan-current-plan"
                value={subscription.plan}
                readOnly
                className="w-full rounded-md border bg-muted px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="change-plan-plan">
                {t("subscriptionChangePlan.plan")}
              </label>
              <select
                id="change-plan-plan"
                value={plan}
                onChange={(e) =>
                  setPlan(e.target.value as (typeof PLAN_OPTIONS)[number])
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                required
              >
                {PLAN_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1">
              <label
                className="text-sm font-medium"
                htmlFor="change-plan-payment-method"
              >
                {t("subscriptionChangePlan.paymentMethod")}
              </label>
              <select
                id="change-plan-payment-method"
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value as (typeof PAYMENT_METHOD_OPTIONS)[number],
                  )
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                required
              >
                {PAYMENT_METHOD_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium" htmlFor="change-plan-notes">
              {t("subscriptionChangePlan.notes")}
            </label>
            <textarea
              id="change-plan-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
              maxLength={1000}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {success ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-sm text-emerald-700">
              <p>
                {t("subscriptionChangePlan.success", {
                  fromPlan: success.fromPlan,
                  toPlan: success.toPlan,
                })}
              </p>
              <p>
                {t("subscriptionChangePlan.planExpiresAt")}:{" "}
                {formatDate(success.planExpiresAt, locale)}
              </p>
              <p>
                {t("subscriptionChangePlan.eventId")}: {success.eventId ?? "—"}
              </p>
              <p>
                {t("subscriptionChangePlan.invoiceId")}:{" "}
                {success.invoiceId ?? "—"}
              </p>
            </div>
          ) : null}

          <div>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("subscriptionChangePlan.submitting")
                : t("subscriptionChangePlan.submit")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
