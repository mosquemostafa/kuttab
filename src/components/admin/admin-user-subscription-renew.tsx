"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import type { SubscriptionDTO } from "@/shared/types/subscription.types";

type AdminUserSubscriptionRenewProps = {
  subscription: SubscriptionDTO | null;
  loading: boolean;
  loadFailed: boolean;
  onActionCompleted?: () => Promise<void>;
};

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

export function AdminUserSubscriptionRenew({
  subscription,
  loading,
  loadFailed,
  onActionCompleted,
}: AdminUserSubscriptionRenewProps) {
  const t = useTranslations("adminUsers");
  const locale = useLocale();

  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof PAYMENT_METHOD_OPTIONS)[number]>("gateway");
  const [paymentReference, setPaymentReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    previousExpiresAt: string;
    newExpiresAt: string;
    addedDays: number;
    eventId: string | null;
  } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!subscription) {
      setError(t("subscriptionRenew.noSubscription"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiClient.adminSubscriptions.renew(subscription.id, {
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setSuccess({
        previousExpiresAt: result.previousExpiresAt,
        newExpiresAt: result.newExpiresAt,
        addedDays: result.addedDays,
        eventId: result.eventId,
      });
      await onActionCompleted?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("subscriptionRenew.submitFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-1 text-base font-semibold">
        {t("subscriptionRenew.title")}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("subscriptionRenew.description")}
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionRenew.loading")}
        </p>
      ) : loadFailed ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionRenew.loadFailed")}
        </p>
      ) : !subscription ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionRenew.noSubscription")}
        </p>
      ) : (
        <form className="grid gap-3" onSubmit={onSubmit}>
          <div className="grid gap-1">
            <label className="text-sm font-medium" htmlFor="renew-current-plan">
              {t("subscriptionRenew.currentPlan")}
            </label>
            <input
              id="renew-current-plan"
              value={subscription.plan}
              readOnly
              className="w-full rounded-md border bg-muted px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-1">
            <label
              className="text-sm font-medium"
              htmlFor="renew-payment-method"
            >
              {t("subscriptionRenew.paymentMethod")}
            </label>
            <select
              id="renew-payment-method"
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

          <div className="grid gap-1">
            <label
              className="text-sm font-medium"
              htmlFor="renew-payment-reference"
            >
              {t("subscriptionRenew.paymentReference")}
            </label>
            <input
              id="renew-payment-reference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              maxLength={255}
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium" htmlFor="renew-notes">
              {t("subscriptionRenew.notes")}
            </label>
            <textarea
              id="renew-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
              maxLength={1000}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {success ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-sm text-emerald-700">
              <p>{t("subscriptionRenew.success")}</p>
              <p>
                {t("subscriptionRenew.addedDays")}: {success.addedDays}
              </p>
              <p>
                {t("subscriptionRenew.previousExpiresAt")}:{" "}
                {formatDate(success.previousExpiresAt, locale)}
              </p>
              <p>
                {t("subscriptionRenew.newExpiresAt")}:{" "}
                {formatDate(success.newExpiresAt, locale)}
              </p>
              <p>
                {t("subscriptionRenew.eventId")}: {success.eventId ?? "—"}
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
                ? t("subscriptionRenew.submitting")
                : t("subscriptionRenew.submit")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
