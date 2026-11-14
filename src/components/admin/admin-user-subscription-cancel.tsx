"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import type { SubscriptionDTO } from "@/shared/types/subscription.types";

type AdminUserSubscriptionCancelProps = {
  subscription: SubscriptionDTO | null;
  loading: boolean;
  loadFailed: boolean;
  onActionCompleted?: () => Promise<void>;
};

export function AdminUserSubscriptionCancel({
  subscription,
  loading,
  loadFailed,
  onActionCompleted,
}: AdminUserSubscriptionCancelProps) {
  const t = useTranslations("adminUsers");

  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    subscriptionId: string;
    eventId: string | null;
  } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!subscription) {
      setError(t("subscriptionCancel.noSubscription"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiClient.adminSubscriptions.cancel(
        subscription.id,
        {
          notes: notes.trim() || undefined,
        },
      );

      setSuccess({
        subscriptionId: result.subscriptionId,
        eventId: result.eventId,
      });
      await onActionCompleted?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("subscriptionCancel.submitFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-card p-4">
      <h2 className="mb-1 text-base font-semibold">
        {t("subscriptionCancel.title")}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("subscriptionCancel.description")}
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionCancel.loading")}
        </p>
      ) : loadFailed ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionCancel.loadFailed")}
        </p>
      ) : !subscription ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionCancel.noSubscription")}
        </p>
      ) : (
        <form className="grid gap-3" onSubmit={onSubmit}>
          <div className="grid gap-1">
            <label
              className="text-sm font-medium"
              htmlFor="cancel-current-plan"
            >
              {t("subscriptionCancel.currentPlan")}
            </label>
            <input
              id="cancel-current-plan"
              value={subscription.plan}
              readOnly
              className="w-full rounded-md border bg-muted px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium" htmlFor="cancel-notes">
              {t("subscriptionCancel.notes")}
            </label>
            <textarea
              id="cancel-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
              maxLength={1000}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {success ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-sm text-emerald-700">
              <p>{t("subscriptionCancel.success")}</p>
              <p>
                {t("subscriptionCancel.subscriptionId")}:{" "}
                {success.subscriptionId}
              </p>
              <p>
                {t("subscriptionCancel.eventId")}: {success.eventId ?? "—"}
              </p>
            </div>
          ) : null}

          <div>
            <button
              type="submit"
              className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("subscriptionCancel.submitting")
                : t("subscriptionCancel.submit")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
