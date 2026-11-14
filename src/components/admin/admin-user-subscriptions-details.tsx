"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";

import { apiClient } from "@/lib/api/api-client";
import { AdminUserSubscriptionActionsMenu } from "@/components/admin/admin-user-subscription-actions-menu";
import type { SubscriptionDTO } from "@/shared/types/subscription.types";
import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";
import { PLAN_CONFIG } from "@/server/modules/subscriptions/subscription-entitlements";

type AdminUserSubscriptionsDetailsProps = {
  userId: string;
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

export function AdminUserSubscriptionsDetails({
  userId,
}: AdminUserSubscriptionsDetailsProps) {
  const t = useTranslations("adminUsers");
  const locale = useLocale();
  const [subscription, setSubscription] = useState<SubscriptionDTO | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveError, setNotesSaveError] = useState<string | null>(null);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);
  const [isSubscriptionIdCopied, setIsSubscriptionIdCopied] = useState(false);

  const refreshSubscription = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);

    try {
      const data = await apiClient.adminSubscriptions.getByUserId(userId);
      setSubscription(data);
    } catch {
      setSubscription(null);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refreshSubscription();
  }, [refreshSubscription]);

  useEffect(() => {
    setNotesDraft(subscription?.notes ?? "");
  }, [subscription?.id, subscription?.notes]);

  const isSubscriptionActive = subscription
    ? subscription.plan === SubscriptionPlanEnum.FREE ||
      new Date(subscription.planExpiresAt).getTime() > Date.now()
    : false;
  const planConfig = subscription ? PLAN_CONFIG[subscription.plan] : null;
  const language = locale.startsWith("ar") ? "ar" : "en";

  async function saveNotes() {
    if (!subscription) {
      return;
    }

    setIsSavingNotes(true);
    setNotesSaveError(null);
    setNotesSaveSuccess(false);

    try {
      const normalizedNotes = notesDraft.trim();
      const result = await apiClient.adminSubscriptions.updateNotes(
        subscription.id,
        {
          notes: normalizedNotes.length > 0 ? notesDraft : null,
        },
      );
      setNotesDraft(result.notes ?? "");
      await refreshSubscription();
      setNotesSaveSuccess(true);
    } catch (error) {
      if (error instanceof Error) {
        setNotesSaveError(error.message);
      } else {
        setNotesSaveError(t("subscriptionDetails.notesUpdateFailed"));
      }
    } finally {
      setIsSavingNotes(false);
    }
  }

  async function copySubscriptionId() {
    if (!subscription) {
      return;
    }

    try {
      await navigator.clipboard.writeText(subscription.id);
      setIsSubscriptionIdCopied(true);
      window.setTimeout(() => setIsSubscriptionIdCopied(false), 1500);
    } catch {
      // no-op
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">
          {t("subscriptionDetails.title")}
        </h2>
        <AdminUserSubscriptionActionsMenu
          userId={userId}
          subscription={subscription}
          loading={loading}
          loadFailed={loadFailed}
          onActionCompleted={refreshSubscription}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionDetails.loading")}
        </p>
      ) : loadFailed ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionDetails.loadFailed")}
        </p>
      ) : !subscription ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionDetails.noSubscription")}
        </p>
      ) : (
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-muted-foreground">
              {t("subscriptionDetails.plan")}
            </p>
            <p className="font-medium">
              {planConfig?.emoji ? `${planConfig.emoji} ` : ""}
              {planConfig?.displayName[language] ?? subscription.plan}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {t("subscriptionDetails.status")}
            </p>
            <p className="font-medium">
              {isSubscriptionActive
                ? t("statuses.active")
                : t("statuses.planInactive")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {t("subscriptionDetails.autoRenew")}
            </p>
            <p className="font-medium">
              {subscription.autoRenew
                ? t("subscriptionDetails.yes")
                : t("subscriptionDetails.no")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {t("subscriptionDetails.trialUsed")}
            </p>
            <p className="font-medium">
              {subscription.trialUsed
                ? t("subscriptionDetails.yes")
                : t("subscriptionDetails.no")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {t("subscriptionDetails.planStartedAt")}
            </p>
            <p className="font-medium">
              {formatDate(subscription.planStartedAt, locale)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {t("subscriptionDetails.planExpiresAt")}
            </p>
            <p className="font-medium">
              {formatDate(subscription.planExpiresAt, locale)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {t("subscriptionDetails.activatedBy")}
            </p>
            <p className="font-medium">{subscription.activatedBy}</p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {t("subscriptionDetails.activatedAt")}
            </p>
            <p className="font-medium">
              {formatDate(subscription.activatedAt, locale)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {t("subscriptionDetails.gateway")}
            </p>
            <p className="font-medium">{subscription.gateway ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {t("subscriptionDetails.subscriptionId")}
            </p>
            <button
              type="button"
              onClick={() => {
                void copySubscriptionId();
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label={t("subscriptionDetails.copySubscriptionId")}
              title={
                isSubscriptionIdCopied
                  ? t("subscriptionDetails.subscriptionIdCopied")
                  : t("subscriptionDetails.copySubscriptionId")
              }
            >
              {isSubscriptionIdCopied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <p className="mb-1 text-muted-foreground">
              {t("subscriptionDetails.notes")}
            </p>
            <textarea
              value={notesDraft}
              onChange={(e) => {
                setNotesDraft(e.target.value);
                setNotesSaveSuccess(false);
                setNotesSaveError(null);
              }}
              placeholder={t("subscriptionDetails.notesPlaceholder")}
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
              maxLength={1000}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={saveNotes}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSavingNotes}
              >
                {isSavingNotes
                  ? t("subscriptionDetails.savingNotes")
                  : t("subscriptionDetails.saveNotes")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNotesDraft("");
                  setNotesSaveSuccess(false);
                  setNotesSaveError(null);
                }}
                className="rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent"
                disabled={isSavingNotes}
              >
                {t("subscriptionDetails.clearNotes")}
              </button>
              {notesSaveSuccess ? (
                <p className="text-sm text-emerald-600">
                  {t("subscriptionDetails.notesUpdated")}
                </p>
              ) : null}
              {notesSaveError ? (
                <p className="text-sm text-destructive">{notesSaveError}</p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
