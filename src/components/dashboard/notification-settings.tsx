"use client";

import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellOff, BellRing, RefreshCw, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useFcm } from "@/hooks/use-fcm";
import { apiClient } from "@/lib/api/api-client";
import { getFcmClientInfo } from "@/lib/fcm-client-info";
import { cn } from "@/lib/utils";

type RegistrationState = "idle" | "loading" | "registered" | "not_registered";
type FinalStatus =
  | "unsupported"
  | "default"
  | "blocked"
  | "needs_activation"
  | "enabled";

export default function NotificationSettings() {
  const t = useTranslations("settings.notifications");
  const {
    isSupported,
    isLoading: fcmLoading,
    permission,
    token,
    error: fcmError,
    getFcmToken,
    requestPermissionAndGetToken,
  } = useFcm();
  const [, setRegistrationState] = useState<RegistrationState>("idle");
  const [mounted, setMounted] = useState(false);
  const [resolving, setResolving] = useState(true);
  const [finalStatus, setFinalStatus] = useState<FinalStatus>("default");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [customTopicsLoading, setCustomTopicsLoading] = useState(false);
  const [customTopicsSaving, setCustomTopicsSaving] = useState(false);
  const [availableCustomTopics, setAvailableCustomTopics] = useState<string[]>(
    [],
  );
  const [subscribedCustomTopics, setSubscribedCustomTopics] = useState<
    string[]
  >([]);
  const resolveRunRef = useRef(0);

  const customTopicLabel = useCallback(
    (topic: string) => {
      switch (topic) {
        case "product_updates":
          return t("customTopics.labels.product_updates");
        default:
          return topic;
      }
    },
    [t],
  );

  const unsupported = finalStatus === "unsupported";
  const denied = finalStatus === "blocked";
  const showDeviceNotRegistered = finalStatus === "needs_activation";
  const fullyEnabled = finalStatus === "enabled";
  const showEnableCta =
    finalStatus === "default" || finalStatus === "needs_activation";

  const badgeToneClass = fullyEnabled
    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-200"
    : showDeviceNotRegistered
      ? "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100"
      : denied
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-border bg-muted text-foreground";

  const statusLabel = unsupported
    ? t("status.unsupported")
    : fullyEnabled
      ? t("status.enabled")
      : showDeviceNotRegistered
        ? t("status.needsDeviceRegistration")
        : denied
          ? t("status.blocked")
          : t("status.notEnabled");

  const statusDescription = unsupported
    ? t("statusDescription.unsupported")
    : denied
      ? t("statusDescription.blocked")
      : showDeviceNotRegistered
        ? t("statusDescription.needsDeviceRegistration")
        : fullyEnabled
          ? t("statusDescription.enabled")
          : t("statusDescription.default");

  const StatusIcon = useMemo(() => {
    if (unsupported) return ShieldAlert;
    if (denied) return BellOff;
    if (showDeviceNotRegistered) return BellRing;
    if (fullyEnabled) return Bell;
    return Bell;
  }, [denied, fullyEnabled, showDeviceNotRegistered, unsupported]);

  const resolveFinalStatus = useCallback(async () => {
    const runId = ++resolveRunRef.current;
    setResolving(true);

    try {
      if (!isSupported) {
        if (resolveRunRef.current === runId) {
          setRegistrationState("idle");
          setFinalStatus("unsupported");
        }
        return;
      }

      if (permission === "denied") {
        if (resolveRunRef.current === runId) {
          setRegistrationState("not_registered");
          setFinalStatus("blocked");
        }
        return;
      }

      if (permission === "default") {
        if (resolveRunRef.current === runId) {
          setRegistrationState("idle");
          setFinalStatus("default");
        }
        return;
      }

      let activeToken = token;
      if (!activeToken) {
        activeToken = await getFcmToken();
      }

      if (!activeToken) {
        if (resolveRunRef.current === runId) {
          setRegistrationState("idle");
          setFinalStatus("default");
        }
        return;
      }

      const info = getFcmClientInfo();
      setRegistrationState("loading");
      await apiClient.fcm.register({
        token: activeToken,
        device: info.device,
        os: info.os,
        userAgent: info.userAgent,
        source: info.source,
      });

      if (resolveRunRef.current === runId) {
        setRegistrationState("registered");
        setFinalStatus("enabled");
      }
    } catch {
      if (resolveRunRef.current === runId) {
        setRegistrationState("not_registered");
        setFinalStatus(
          permission === "granted" ? "needs_activation" : "default",
        );
      }
    } finally {
      if (resolveRunRef.current === runId) {
        setResolving(false);
      }
    }
  }, [getFcmToken, isSupported, permission, token]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    void resolveFinalStatus();
  }, [resolveFinalStatus]);

  // Safety fallback: ensure skeleton never remains stuck indefinitely
  useEffect(() => {
    if (!resolving) return;
    const timer = setTimeout(() => {
      setResolving(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, [resolving]);

  const loadCustomTopics = useCallback(async () => {
    setCustomTopicsLoading(true);
    try {
      const data = await apiClient.fcm.customTopics();
      setAvailableCustomTopics(data.availableTopics ?? []);
      setSubscribedCustomTopics(data.subscribedTopics ?? []);
    } catch {
      toast.error(t("customTopics.messages.loadError"));
    } finally {
      setCustomTopicsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadCustomTopics();
  }, [loadCustomTopics]);

  async function registerCurrentDevice() {
    setSaving(true);
    try {
      let currentToken = token;
      if (!currentToken) {
        currentToken = await requestPermissionAndGetToken();
      }

      if (!currentToken) {
        toast.error(t("messages.unableToEnable"));
        return;
      }

      const info = getFcmClientInfo();
      await apiClient.fcm.register({
        token: currentToken,
        device: info.device,
        os: info.os,
        userAgent: info.userAgent,
        source: info.source,
      });

      setRegistrationState("registered");
      setFinalStatus("enabled");
      toast.success(t("messages.enabledSuccess"));
    } catch {
      toast.error(t("messages.unableToEnable"));
    } finally {
      setSaving(false);
    }
  }

  async function handleRecheck() {
    setChecking(true);
    try {
      await resolveFinalStatus();
    } catch {
      toast.error(t("messages.unableToCheckStatus"));
    } finally {
      setChecking(false);
    }
  }

  async function updateCustomTopic(topic: string, subscribed: boolean) {
    setCustomTopicsSaving(true);
    try {
      const data = await apiClient.fcm.setCustomTopicSubscription({
        topic,
        subscribed,
      });
      setSubscribedCustomTopics(data.customTopics);
      toast.success(
        subscribed
          ? t("customTopics.messages.subscribed")
          : t("customTopics.messages.unsubscribed"),
      );
    } catch {
      toast.error(t("customTopics.messages.updateError"));
    } finally {
      setCustomTopicsSaving(false);
    }
  }

  const isTopicSubscribed = useCallback(
    (topic: string) => subscribedCustomTopics.includes(topic),
    [subscribedCustomTopics],
  );

  const canChangeCustomTopics = fullyEnabled && !customTopicsSaving;

  if (!mounted || resolving) {
    return (
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 gap-4">
              <div className="hidden size-11 shrink-0 rounded-xl border border-border/60 bg-muted/50 sm:block" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/40 p-4 dark:bg-muted/20">
            <div className="flex gap-4">
              <div className="size-11 animate-pulse rounded-lg bg-muted" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-5 w-full animate-pulse rounded bg-muted" />
                <div className="h-8 w-44 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/40 p-4 dark:bg-muted/20">
            <div className="space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between rounded-md border bg-background/70 p-3">
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="h-6 w-12 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="flex items-center justify-between rounded-md border bg-background/70 p-3">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-6 w-12 animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div
            className="hidden size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary sm:flex"
            aria-hidden
          >
            <Bell className="size-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-medium">{t("title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("description")}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn("h-6 px-2.5 py-0 text-xs", badgeToneClass)}
        >
          {statusLabel}
        </Badge>
      </div>

      {showDeviceNotRegistered ? (
        <div className="mt-4 rounded-lg border border-amber-500/35 bg-amber-500/8 p-3 text-sm dark:border-amber-400/25 dark:bg-amber-500/10">
          <p className="font-medium text-amber-950 dark:text-amber-50">
            {t("deviceRegistration.alertTitle")}
          </p>
          <p className="mt-1 text-amber-950/85 dark:text-amber-50/90">
            {t("deviceRegistration.alertBody")}
          </p>
        </div>
      ) : null}

      <div
        className={cn(
          "mt-4 flex gap-4 rounded-xl border border-border/80 bg-muted/40 p-4 dark:bg-muted/20",
          fullyEnabled && "border-emerald-500/20 bg-emerald-500/6",
          showDeviceNotRegistered && "border-amber-500/15 bg-amber-500/5",
          denied && "border-destructive/20 bg-destructive/4",
        )}
      >
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border",
            fullyEnabled && "text-emerald-600 dark:text-emerald-400",
            showDeviceNotRegistered && "text-amber-600 dark:text-amber-400",
            denied && "text-destructive",
          )}
        >
          <StatusIcon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm leading-relaxed text-foreground/90">
            {statusDescription}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {showEnableCta && (
              <Button
                type="button"
                size="sm"
                onClick={() => void registerCurrentDevice()}
                disabled={saving || fcmLoading}
              >
                <BellRing className="size-4" />
                {saving ? t("actions.enabling") : t("actions.enable")}
              </Button>
            )}

            {denied && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleRecheck()}
                  disabled={checking || fcmLoading}
                >
                  <RefreshCw
                    className={cn("size-4", checking && "animate-spin")}
                  />
                  {checking ? t("actions.rechecking") : t("actions.recheck")}
                </Button>
                <Link
                  href="/help/notifications"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t("actions.howToEnable")}
                </Link>
              </>
            )}
          </div>

          {fcmError ? (
            <p className="text-xs text-destructive">
              {t("messages.unableToEnable")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border/80 bg-muted/40 p-4 dark:bg-muted/20">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">{t("customTopics.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("customTopics.description")}
          </p>
          {!fullyEnabled ? (
            <p className="text-xs text-muted-foreground">
              {t("customTopics.enableFirstHint")}
            </p>
          ) : null}
        </div>

        <div className="mt-3 space-y-2">
          {customTopicsLoading ? (
            <p className="text-sm text-muted-foreground">
              {t("customTopics.loading")}
            </p>
          ) : availableCustomTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("customTopics.empty")}
            </p>
          ) : (
            availableCustomTopics.map((topic) => {
              const subscribed = isTopicSubscribed(topic);
              return (
                <div
                  key={topic}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background/70 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {customTopicLabel(topic)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={subscribed}
                      aria-label={customTopicLabel(topic)}
                      disabled={!canChangeCustomTopics}
                      onCheckedChange={(checked) =>
                        void updateCustomTopic(topic, checked)
                      }
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
