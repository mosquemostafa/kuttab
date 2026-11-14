"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { useLocale, useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";

import { apiClient } from "@/lib/api/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SWR_KEY = "dashboard-newsletter-status";

const NEWSLETTER_LOCALE_OPTIONS = ["ar", "en"] as const;

type NewsletterLocale = (typeof NEWSLETTER_LOCALE_OPTIONS)[number];

const NEWSLETTER_LOCALE_ICONS: Record<NewsletterLocale, string> = {
  ar: "أ",
  en: "A",
};

function normalizeNewsletterLocale(
  value: string | null | undefined,
): NewsletterLocale {
  return value === "en" || value === "ar" ? value : "ar";
}

export function DashboardNewsletterSubscribePanel({
  accountEmail,
  showHeader = true,
  titleId,
}: {
  accountEmail: string;
  /** When false, only the form controls (for pages that provide their own intro). */
  showHeader?: boolean;
  /** Optional id for the main heading (accessibility). */
  titleId?: string;
}) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [localeSaving, setLocaleSaving] = useState(false);

  const appLocale: NewsletterLocale = useMemo(
    () => (locale === "en" || locale === "ar" ? locale : "ar"),
    [locale],
  );

  const [pendingLocale, setPendingLocale] =
    useState<NewsletterLocale>(appLocale);

  const { data, error, mutate, isLoading } = useSWR(
    accountEmail.trim() ? SWR_KEY : null,
    () => apiClient.dashboardNewsletter.getStatus(),
    { revalidateOnFocus: true, dedupingInterval: 2000 },
  );

  const subscribed = data?.subscribed === true;

  const displayLocale = useMemo(
    () => normalizeNewsletterLocale(data?.locale),
    [data?.locale],
  );

  const onLocaleChange = useCallback(
    async (next: NewsletterLocale) => {
      if (!subscribed) {
        setPendingLocale(next);
        return;
      }
      if (next === displayLocale) {
        return;
      }
      setLocaleSaving(true);
      try {
        await apiClient.dashboardNewsletter.updateLocale({ locale: next });
        toast.success(t("newsletter.messages.localeUpdated"));
        await mutate();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : t("newsletter.messages.error"),
        );
      } finally {
        setLocaleSaving(false);
      }
    },
    [displayLocale, mutate, subscribed, t],
  );

  const onSubscribe = useCallback(async () => {
    setBusy(true);
    try {
      await apiClient.dashboardNewsletter.subscribe({
        locale: pendingLocale,
      });
      toast.success(t("newsletter.messages.subscribed"));
      await mutate();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("newsletter.messages.error"),
      );
    } finally {
      setBusy(false);
    }
  }, [mutate, pendingLocale, t]);

  const onUnsubscribe = useCallback(async () => {
    setBusy(true);
    try {
      await apiClient.dashboardNewsletter.unsubscribe();
      toast.success(t("newsletter.messages.unsubscribed"));
      await mutate();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("newsletter.messages.error"),
      );
    } finally {
      setBusy(false);
    }
  }, [mutate, t]);

  if (!accountEmail.trim()) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        {showHeader ? (
          <div className="flex min-w-0 gap-4">
            <div
              className="hidden size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary sm:flex"
              aria-hidden
            >
              <Mail className="size-5" strokeWidth={1.75} />
            </div>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {t("newsletter.title")}
            </h2>
          </div>
        ) : null}
        <p className="text-muted-foreground mt-2 text-sm">
          {t("newsletter.noEmail")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      {showHeader ? (
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div
              className="hidden size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary sm:flex"
              aria-hidden
            >
              <Mail className="size-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id={titleId}
                  className="text-lg font-semibold tracking-tight"
                >
                  {t("newsletter.title")}
                </h2>
                {!isLoading && !error && data ? (
                  subscribed ? (
                    <Badge variant="secondary">
                      {t("newsletter.status.subscribed")}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {t("newsletter.status.notSubscribed")}
                    </Badge>
                  )
                ) : null}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("newsletter.description")}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className={`grid gap-4 sm:grid-cols-2 ${showHeader ? "mt-6" : ""}`}>
        <div className="grid gap-1.5 w-full">
          <Label
            htmlFor="dashboard-newsletter-email-panel"
            className="text-muted-foreground text-xs font-medium"
          >
            {t("newsletter.emailLabel")}
          </Label>
          <Input
            id="dashboard-newsletter-email-panel"
            type="email"
            readOnly
            autoComplete="email"
            value={accountEmail}
            className="bg-muted/40"
          />
        </div>

        <div className="grid gap-2 w-full">
          <Label className="text-xs font-medium">
            {t("newsletter.preferredLocaleLabel")}
          </Label>
          <Select
            value={subscribed ? displayLocale : pendingLocale}
            onValueChange={(value) =>
              void onLocaleChange(normalizeNewsletterLocale(value))
            }
            disabled={isLoading || !!error || localeSaving}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("newsletter.preferredLocaleLabel")} />
            </SelectTrigger>
            <SelectContent>
              {NEWSLETTER_LOCALE_OPTIONS.map((option) => {
                const iconLetter = NEWSLETTER_LOCALE_ICONS[option];

                return (
                  <SelectItem key={option} value={option}>
                    <span className="inline-flex items-center gap-2">
                      <span className="text-xs font-semibold leading-none text-muted-foreground">
                        {iconLetter}
                      </span>
                      <span>
                        {option === "ar"
                          ? t("language.options.ar")
                          : t("language.options.en")}
                      </span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {error ? (
          <p className="text-destructive text-sm">
            {t("newsletter.messages.loadError")}
          </p>
        ) : null}
        {!isLoading && !error && data && !subscribed ? (
          <Button
            type="button"
            onClick={() => void onSubscribe()}
            disabled={busy || localeSaving}
          >
            {busy
              ? t("newsletter.actions.subscribing")
              : t("newsletter.actions.subscribe")}
          </Button>
        ) : null}
        {!isLoading && !error && data && subscribed ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={busy || localeSaving}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                {busy
                  ? t("newsletter.actions.unsubscribing")
                  : t("newsletter.actions.unsubscribe")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("newsletter.unsubscribeDialog.title")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("newsletter.unsubscribeDialog.description")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("newsletter.unsubscribeDialog.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => void onUnsubscribe()}
                >
                  {t("newsletter.unsubscribeDialog.confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
    </div>
  );
}
