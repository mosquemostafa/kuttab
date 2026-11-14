"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import type {
  SubscriptionDTO,
  SubscriptionEventDTO,
} from "@/shared/types/subscription.types";

type AdminUserSubscriptionEventsProps = {
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

export function AdminUserSubscriptionEvents({
  userId,
}: AdminUserSubscriptionEventsProps) {
  const t = useTranslations("adminUsers");
  const locale = useLocale();

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionDTO | null>(
    null,
  );
  const [events, setEvents] = useState<SubscriptionEventDTO[]>([]);
  const [actorNamesById, setActorNamesById] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadFailed(false);

      try {
        const sub = await apiClient.adminSubscriptions.getByUserId(userId);
        if (cancelled) return;

        setSubscription(sub);

        if (!sub) {
          setEvents([]);
          return;
        }

        const list = await apiClient.adminSubscriptions.listEvents(sub.id);
        if (!cancelled) {
          setEvents(list);
        }
      } catch {
        if (!cancelled) {
          setLoadFailed(true);
          setEvents([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const ids = Array.from(
      new Set(
        events
          .map((event) =>
            typeof event.actorId === "string"
              ? event.actorId
              : (event.actorId?.id ?? null),
          )
          .filter((actorId): actorId is string => Boolean(actorId)),
      ),
    ).filter((actorId) => !actorNamesById[actorId]);

    if (ids.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadActorNames() {
      const results = await Promise.all(
        ids.map(async (actorId) => {
          try {
            const actor = await apiClient.users.getById(actorId);
            return [actorId, actor.name] as const;
          } catch {
            return [actorId, actorId] as const;
          }
        }),
      );

      if (cancelled) {
        return;
      }

      setActorNamesById((prev) => {
        const next = { ...prev };
        for (const [actorId, actorName] of results) {
          next[actorId] = actorName;
        }
        return next;
      });
    }

    void loadActorNames();

    return () => {
      cancelled = true;
    };
  }, [actorNamesById, events]);

  function getActorName(event: SubscriptionEventDTO) {
    if (!event.actorId) {
      return "—";
    }

    if (typeof event.actorId === "string") {
      return actorNamesById[event.actorId] ?? event.actorId;
    }

    if (event.actorId.name.trim().length > 0) {
      return event.actorId.name;
    }

    return actorNamesById[event.actorId.id] ?? event.actorId.id;
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-base font-semibold">
        {t("subscriptionEvents.title")}
      </h2>

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionEvents.loading")}
        </p>
      ) : loadFailed ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionEvents.loadFailed")}
        </p>
      ) : !subscription ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionEvents.noSubscription")}
        </p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionEvents.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">{event.eventType}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(event.createdAt, locale)} • {getActorName(event)}
                </p>
              </div>
              <Link
                href={`/${locale}/admin/users/${userId}/subscriptions/events/${event.id}`}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                {t("subscriptionEvents.viewDetails")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
