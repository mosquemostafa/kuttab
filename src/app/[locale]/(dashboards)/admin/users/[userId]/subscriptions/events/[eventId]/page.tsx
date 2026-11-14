"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { apiClient } from "@/lib/api/api-client";
import type { SubscriptionEventDTO } from "@/shared/types/subscription.types";

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

function formatPayload(payload: Record<string, unknown>) {
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return "{}";
  }
}

export default function AdminEventByIdPage() {
  const t = useTranslations("adminUsers");
  const locale = useLocale();
  const params = useParams<{ eventId?: string }>();
  const eventId = useMemo(() => params?.eventId ?? "", [params?.eventId]);

  const [event, setEvent] = useState<SubscriptionEventDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!eventId) {
        setEvent(null);
        setLoadFailed(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadFailed(false);

      try {
        const data = await apiClient.adminSubscriptions.getEventById(eventId);
        if (!cancelled) {
          setEvent(data);
        }
      } catch {
        if (!cancelled) {
          setEvent(null);
          setLoadFailed(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="rounded-lg border bg-card p-4">
        <h1 className="mb-3 text-xl font-semibold">
          {t("subscriptionEvents.title")}
        </h1>

        {loading ? (
          <p className="text-sm text-muted-foreground">
            {t("subscriptionEvents.loading")}
          </p>
        ) : loadFailed || !event ? (
          <p className="text-sm text-muted-foreground">
            {t("subscriptionEvents.loadFailed")}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("subscriptionEvents.eventId")}
                </p>
                <p className="break-all font-mono text-xs">{event.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p>{event.eventType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("subscriptionEvents.actorName")}
                </p>
                <p>
                  {event.actorId
                    ? typeof event.actorId === "string"
                      ? event.actorId
                      : event.actorId.name
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Subscription ID</p>
                <p className="break-all font-mono text-xs">
                  {event.subscriptionId}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p>{formatDate(event.createdAt, locale)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gateway</p>
                <p>{event.gateway ?? "—"}</p>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p>{event.notes ?? "—"}</p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs text-muted-foreground">Payload</p>
              <pre className="overflow-x-auto rounded-md border bg-muted p-3 text-xs">
                {formatPayload(event.payload)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
