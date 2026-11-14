"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { useLocale, useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";

import { apiClient } from "@/lib/api/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const SWR_KEY = "dashboard-newsletter-status";

type SiteLocale = "en" | "ar";

function siteLocaleFromNext(locale: string): SiteLocale {
  return locale === "en" || locale === "ar" ? locale : "ar";
}

/**
 * Subscribe-only CTA for the dashboard newsletter channel (list + article).
 * Uses the current site locale when subscribing. Does not offer preferred-locale
 * changes or unsubscribe — users manage those in Settings.
 *
 * When subscribed, renders nothing (including article footer title/description).
 */
export function DashboardNewsletterChannelSubscribeCta({
  accountEmail,
  showHeader = true,
  compact = false,
  /** Renders `<footer>` with article copy + card; whole block omitted if subscribed. */
  articleFooter = false,
}: {
  accountEmail: string;
  showHeader?: boolean;
  compact?: boolean;
  articleFooter?: boolean;
}) {
  const t = useTranslations("newsletterChannel");
  const nextLocale = useLocale();
  const siteLocale = useMemo(
    () => siteLocaleFromNext(nextLocale),
    [nextLocale],
  );

  const [busy, setBusy] = useState(false);

  const { data, error, mutate, isLoading } = useSWR(
    accountEmail.trim() ? SWR_KEY : null,
    () => apiClient.dashboardNewsletter.getStatus(),
    { revalidateOnFocus: true, dedupingInterval: 2000 },
  );

  const onSubscribe = useCallback(async () => {
    setBusy(true);
    try {
      await apiClient.dashboardNewsletter.subscribe({ locale: siteLocale });
      toast.success(t("subscribeCta.messages.subscribed"));
      await mutate();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("subscribeCta.messages.error"),
      );
    } finally {
      setBusy(false);
    }
  }, [mutate, siteLocale, t]);

  if (!accountEmail.trim()) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card shadow-sm",
          compact ? "p-4" : "p-6",
        )}
      >
        {showHeader ? (
          <h2 className="text-base font-semibold tracking-tight">
            {t("subscribeCta.title")}
          </h2>
        ) : null}
        <p className="text-muted-foreground mt-2 text-sm">
          {t("subscribeCta.noEmail")}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return null;
  }

  if (data?.subscribed === true) {
    return null;
  }

  const card = (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm",
        compact ? "p-4" : "p-6",
      )}
    >
      {showHeader ? (
        <div className="flex min-w-0 gap-3">
          <div
            className="hidden size-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-primary sm:flex"
            aria-hidden
          >
            <Mail className="size-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-semibold tracking-tight">
              {t("subscribeCta.title")}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("subscribeCta.description")}
            </p>
          </div>
        </div>
      ) : null}

      {!showHeader && !compact ? (
        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
          {t("subscribeCta.description")}
        </p>
      ) : null}

      <div className={cn("grid gap-3 sm:max-w-lg", showHeader ? "mt-4" : "")}>
        <div className="grid gap-1.5">
          <Label
            htmlFor="newsletter-channel-cta-email"
            className="text-muted-foreground text-xs font-medium"
          >
            {t("subscribeCta.emailLabel")}
          </Label>
          <Input
            id="newsletter-channel-cta-email"
            type="email"
            readOnly
            autoComplete="email"
            value={accountEmail}
            className="bg-muted/40"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {error ? (
          <p className="text-destructive text-sm">
            {t("subscribeCta.messages.loadError")}
          </p>
        ) : null}
        {!error && data ? (
          <Button
            type="button"
            onClick={() => void onSubscribe()}
            disabled={busy}
            className="w-full sm:w-auto"
          >
            {busy
              ? t("subscribeCta.actions.subscribing")
              : t("subscribeCta.actions.subscribe")}
          </Button>
        ) : null}
      </div>
    </div>
  );

  if (articleFooter) {
    return (
      <footer className="mt-14 space-y-3 border-t border-border pt-10">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("article.subscribeFooterTitle")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("article.subscribeFooterDescription")}
        </p>
        {card}
      </footer>
    );
  }

  return card;
}
