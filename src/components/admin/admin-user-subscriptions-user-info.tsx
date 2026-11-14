"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import type { UserWithDetailsDTO } from "@/shared/types/user.types";
import { UserRole } from "@/shared/enums/user-role.enum";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";

type AdminUserSubscriptionsUserInfoProps = {
  userId: string;
};

export function AdminUserSubscriptionsUserInfo({
  userId,
}: AdminUserSubscriptionsUserInfoProps) {
  const t = useTranslations("adminUsers");
  const [user, setUser] = useState<UserWithDetailsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useSetBreadcrumb(userId, user?.name || user?.email);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadFailed(false);
      try {
        const data = await apiClient.users.getById(userId);
        if (!cancelled) {
          setUser(data);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setLoadFailed(true);
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

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-base font-semibold">
        {t("subscriptionUserInfo.title")}
      </h2>

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionUserInfo.loading")}
        </p>
      ) : loadFailed || !user ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionUserInfo.loadFailed")}
        </p>
      ) : (
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="mb-2 text-muted-foreground">
              {t("subscriptionUserInfo.image")}
            </p>
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarImage
                  src={user.avatarUrl ?? user.image ?? undefined}
                  alt={user.name}
                />
                <AvatarFallback>
                  {(user.name || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground">
              {t("subscriptionUserInfo.name")}
            </p>
            <p className="font-medium">{user.name || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {t("subscriptionUserInfo.email")}
            </p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {t("subscriptionUserInfo.role")}
            </p>
            <p className="font-medium">
              {user.role === UserRole.ADMIN
                ? t("roles.admin")
                : user.role === UserRole.CONTENT_MANAGER
                  ? t("roles.contentManager")
                  : user.role === UserRole.SUPPORT
                    ? t("roles.support")
                    : t("roles.user")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {t("subscriptionUserInfo.status")}
            </p>
            <p className="font-medium">
              {user.banned
                ? t("subscriptionUserInfo.statusBanned")
                : t("subscriptionUserInfo.statusActive")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {t("subscriptionUserInfo.emailVerification")}
            </p>
            <p className="font-medium">
              {user.emailVerified
                ? t("statuses.verified")
                : t("statuses.unverified")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {t("subscriptionUserInfo.id")}
            </p>
            <p className="break-all font-mono text-xs">{user.id}</p>
          </div>
        </div>
      )}
    </div>
  );
}
