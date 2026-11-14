"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";

type AdminUserSubscriptionActivateProps = {
  userId: string;
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

export function AdminUserSubscriptionActivate({
  userId,
  onActionCompleted,
}: AdminUserSubscriptionActivateProps) {
  const t = useTranslations("adminUsers");

  const [plan, setPlan] = useState<(typeof PLAN_OPTIONS)[number]>("pro");
  const [autoRenew, setAutoRenew] = useState(true);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof PAYMENT_METHOD_OPTIONS)[number]>("gateway");
  const [paymentReference, setPaymentReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    subscriptionId: string;
    invoiceId: string | null;
    eventId: string | null;
  } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    setIsSubmitting(true);
    try {
      const result = await apiClient.adminSubscriptions.activate({
        userId,
        plan,
        autoRenew,
        notes: notes.trim() || undefined,
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
      });

      setSuccess({
        subscriptionId: result.subscriptionId,
        invoiceId: result.invoiceId,
        eventId: result.eventId,
      });
      await onActionCompleted?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("subscriptionActivate.submitFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-1 text-base font-semibold">
        {t("subscriptionActivate.title")}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("subscriptionActivate.description")}
      </p>

      <form className="grid gap-3" onSubmit={onSubmit}>
        <div className="grid gap-1">
          <label className="text-sm font-medium" htmlFor="activate-plan">
            {t("subscriptionActivate.plan")}
          </label>
          <select
            id="activate-plan"
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

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-1">
            <label
              className="text-sm font-medium"
              htmlFor="activate-payment-method"
            >
              {t("subscriptionActivate.paymentMethod")}
            </label>
            <select
              id="activate-payment-method"
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
          <label
            className="text-sm font-medium"
            htmlFor="activate-payment-reference"
          >
            {t("subscriptionActivate.paymentReference")}
          </label>
          <input
            id="activate-payment-reference"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            maxLength={255}
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium" htmlFor="activate-notes">
            {t("subscriptionActivate.notes")}
          </label>
          <textarea
            id="activate-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
            maxLength={1000}
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoRenew}
            onChange={(e) => setAutoRenew(e.target.checked)}
          />
          <span>{t("subscriptionActivate.autoRenew")}</span>
        </label>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {success ? (
          <p className="text-sm text-emerald-600">
            {t("subscriptionActivate.success", {
              subscriptionId: success.subscriptionId,
            })}
          </p>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t("subscriptionActivate.submitting")
              : t("subscriptionActivate.submit")}
          </button>

          {success ? (
            <span className="text-xs text-muted-foreground">
              {t("subscriptionActivate.ids", {
                invoiceId: success.invoiceId ?? "—",
                eventId: success.eventId ?? "—",
              })}
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
