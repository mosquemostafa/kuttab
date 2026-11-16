"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Ban,
  Check,
  CheckCircle,
  Copy,
  GraduationCap,
  LifeBuoy,
  Mail,
  PenSquare,
  Phone,
  Shield,
  User,
  UserCheck,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import type { Locale } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserRole } from "@/shared/enums/user-role.enum";
import type { UserWithDetailsDTO } from "@/shared/types/user.types";
import { UserActions } from "./user-actions";

export const getAccountIcon = (account: string) => {
  switch (account) {
    case "credential":
      return <Mail className="h-3.5 w-3.5 dark:text-neutral-300" />;
    default:
      return <Mail className="h-3.5 w-3.5 dark:text-neutral-300" />;
  }
};

export function UserRoleBadge({
  role,
}: {
  role: UserRole | string | null | undefined;
}) {
  const t = useTranslations("adminUsers");

  const getBadgeStyle = () => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700";
      case UserRole.CONTENT:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700";
      case UserRole.SUPPORT:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700";
      case UserRole.STUDENT:
        return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800";
      case UserRole.PARENT:
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case UserRole.ADMIN:
        return <Shield className="h-3 w-3" />;
      case UserRole.CONTENT:
        return <PenSquare className="h-3 w-3" />;
      case UserRole.SUPPORT:
        return <LifeBuoy className="h-3 w-3" />;
      case UserRole.STUDENT:
        return <GraduationCap className="h-3 w-3" />;
      case UserRole.PARENT:
        return <UserCheck className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case UserRole.ADMIN:
        return t("roles.admin");
      case UserRole.CONTENT:
        return t("roles.content");
      case UserRole.SUPPORT:
        return t("roles.support");
      case UserRole.STUDENT:
        return t("roles.student");
      case UserRole.PARENT:
        return t("roles.parent");
      default:
        return t("roles.user");
    }
  };

  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 px-2 py-0.5 text-xs font-normal ${getBadgeStyle()}`}
    >
      {getRoleIcon()}
      <span>{getRoleLabel()}</span>
    </Badge>
  );
}

export function UserVerificationBadge({
  emailVerified,
}: {
  emailVerified: boolean;
}) {
  const t = useTranslations("adminUsers");

  return emailVerified ? (
    <Badge
      variant="outline"
      className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700 flex items-center gap-1 px-2 py-0.5 text-xs font-normal"
    >
      <CheckCircle className="h-3 w-3" />
      <span>{t("statuses.verified")}</span>
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700 flex items-center gap-1 px-2 py-0.5 text-xs font-normal"
    >
      <XCircle className="h-3 w-3" />
      <span>{t("statuses.unverified")}</span>
    </Badge>
  );
}

export function UserStatusBadge({
  user,
  dateLocale,
}: {
  user: UserWithDetailsDTO;
  dateLocale: Locale;
}) {
  const t = useTranslations("adminUsers");

  if (user.banned) {
    return (
      <div className="flex flex-col gap-0.5">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="destructive"
                className="flex items-center gap-1 px-2 py-0.5 text-xs cursor-help font-normal"
              >
                <Ban className="h-3 w-3" />
                <span>{t("statuses.banned")}</span>
              </Badge>
            </TooltipTrigger>
            {user.banReason && (
              <TooltipContent>
                {t("statuses.reason")}: {user.banReason}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        {user.banExpires && (
          <span className="text-[11px] text-muted-foreground">
            {t("statuses.expires", {
              date: format(new Date(user.banExpires), "PP", {
                locale: dateLocale,
              }),
            })}
          </span>
        )}
      </div>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700 flex items-center gap-1 px-2 py-0.5 text-xs font-normal"
    >
      <Check className="h-3 w-3" />
      <span>{t("statuses.active")}</span>
    </Badge>
  );
}

export function UserSegmentBadge({
  segment,
}: {
  segment: UserWithDetailsDTO["segment"];
}) {
  const t = useTranslations("adminUsers");

  if (segment) {
    return (
      <Badge
        variant="outline"
        className="flex w-fit items-center gap-1 px-2 py-0.5 text-xs font-normal"
      >
        <span>{segment.icon}</span>
        <span>{segment.name}</span>
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs px-2 py-0.5 font-normal">
      {t("statuses.noSegment")}
    </Badge>
  );
}

interface UseUserColumnsOptions {
  dateLocale: Locale;
  copiedUserId: string | null;
  onCopyUserId: (id: string) => void;
  onActionComplete: () => void;
}

export function useUserColumns({
  dateLocale,
  copiedUserId,
  onCopyUserId,
  onActionComplete,
}: UseUserColumnsOptions): ColumnDef<UserWithDetailsDTO>[] {
  const t = useTranslations("adminUsers");

  return useMemo(
    () => [
      {
        id: "id",
        header: t("columns.id"),
        size: 60,
        cell: ({ row }) => {
          const user = row.original;
          const isCopied = copiedUserId === user.id;

          return (
            <button
              type="button"
              onClick={() => onCopyUserId(user.id)}
              className="inline-flex items-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              aria-label={t("actions.copyUserId")}
              title={
                isCopied ? t("actions.copiedUserId") : t("actions.copyUserId")
              }
            >
              {isCopied ? (
                <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          );
        },
      },
      {
        accessorKey: "name",
        header: t("columns.name"),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage
                  src={user.avatarUrl ?? undefined}
                  alt={user.name}
                />
                <AvatarFallback className="text-xs">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {user.name}
                </span>
                <span className="text-xs text-muted-foreground" dir="ltr">
                  {user.email}
                </span>
                {user.phone ? (
                  <a
                    href={`tel:${user.phone}`}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5 transition-colors w-fit"
                    dir="ltr"
                  >
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>{user.phone}</span>
                  </a>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        id: "verification",
        header: t("columns.verification"),
        cell: ({ row }) => (
          <UserVerificationBadge emailVerified={row.original.emailVerified} />
        ),
      },
      {
        id: "linkedAccounts",
        header: t("columns.linkedAccounts"),
        cell: ({ row }) => {
          const accounts = row.original.accounts;
          return (
            <div className="flex -space-x-2">
              {accounts.map((account) => (
                <div
                  key={account}
                  className="rounded-full bg-muted p-1.5 text-muted-foreground dark:bg-neutral-700"
                  title={account}
                >
                  {getAccountIcon(account)}
                </div>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: t("columns.role"),
        cell: ({ row }) => <UserRoleBadge role={row.original.role} />,
      },
      {
        id: "segment",
        header: t("columns.segment"),
        cell: ({ row }) => <UserSegmentBadge segment={row.original.segment} />,
      },
      {
        id: "status",
        header: t("columns.status"),
        cell: ({ row }) => (
          <UserStatusBadge user={row.original} dateLocale={dateLocale} />
        ),
      },
      {
        id: "lastSignIn",
        header: t("columns.lastSignIn"),
        cell: ({ row }) => {
          const lastSignIn = row.original.lastSignIn;
          return (
            <span className="text-xs text-muted-foreground">
              {lastSignIn
                ? format(new Date(lastSignIn), "PPp", { locale: dateLocale })
                : t("statuses.never")}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: t("columns.createdAt"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {format(new Date(row.original.createdAt), "PPp", {
              locale: dateLocale,
            })}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("columns.actions"),
        size: 80,
        cell: ({ row }) => (
          <UserActions
            user={row.original}
            onActionComplete={onActionComplete}
          />
        ),
      },
    ],
    [t, dateLocale, copiedUserId, onCopyUserId, onActionComplete],
  );
}
