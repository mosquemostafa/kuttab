"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import type { SubscriptionDTO } from "@/shared/types/subscription.types";

type AdminUserSubscriptionExtendProps = {
  subscription: SubscriptionDTO | null;
  loading: boolean;
  loadFailed: boolean;
  onActionCompleted?: () => Promise<void>;
};

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

export function AdminUserSubscriptionExtend({
  subscription,
  loading,
  loadFailed,
  onActionCompleted,
}: AdminUserSubscriptionExtendProps) {
  const t = useTranslations("adminUsers");
  const locale = useLocale();

  const [addedDays, setAddedDays] = useState("30");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    previousExpiresAt: string;
    newExpiresAt: string;
    eventId: string | null;
  } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!subscription) {
      setError(t("subscriptionExtend.noSubscription"));
      return;
    }

    const parsedAddedDays = Number.parseInt(addedDays, 10);
    if (!Number.isFinite(parsedAddedDays) || parsedAddedDays < 1) {
      setError(t("subscriptionExtend.validationAddedDays"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiClient.adminSubscriptions.extend(
        subscription.id,
        {
          addedDays: parsedAddedDays,
          notes: notes.trim() || undefined,
        },
      );

      setSuccess({
        previousExpiresAt: result.previousExpiresAt,
        newExpiresAt: result.newExpiresAt,
        eventId: result.eventId,
      });
      await onActionCompleted?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("subscriptionExtend.submitFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-1 text-base font-semibold">
        {t("subscriptionExtend.title")}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("subscriptionExtend.description")}
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionExtend.loading")}
        </p>
      ) : loadFailed ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionExtend.loadFailed")}
        </p>
      ) : !subscription ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionExtend.noSubscription")}
        </p>
      ) : (
        <form className="grid gap-3" onSubmit={onSubmit}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1">
              <label
                className="text-sm font-medium"
                htmlFor="extend-current-plan"
              >
                {t("subscriptionExtend.currentPlan")}
              </label>
              <input
                id="extend-current-plan"
                value={subscription.plan}
                readOnly
                className="w-full rounded-md border bg-muted px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-1">
              <label
                className="text-sm font-medium"
                htmlFor="extend-added-days"
              >
                {t("subscriptionExtend.addedDays")}
              </label>
              <input
                id="extend-added-days"
                type="number"
                min={1}
                step={1}
                value={addedDays}
                onChange={(e) => setAddedDays(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium" htmlFor="extend-notes">
              {t("subscriptionExtend.notes")}
            </label>
            <textarea
              id="extend-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
              maxLength={1000}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {success ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-sm text-emerald-700">
              <p>{t("subscriptionExtend.success")}</p>
              <p>
                {t("subscriptionExtend.previousExpiresAt")}:{" "}
                {formatDate(success.previousExpiresAt, locale)}
              </p>
              <p>
                {t("subscriptionExtend.newExpiresAt")}:{" "}
                {formatDate(success.newExpiresAt, locale)}
              </p>
              <p>
                {t("subscriptionExtend.eventId")}: {success.eventId ?? "—"}
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
                ? t("subscriptionExtend.submitting")
                : t("subscriptionExtend.submit")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
