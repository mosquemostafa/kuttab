"use client";
import {
  CheckCircle,
  XCircle,
  Mail,
  Ban,
  Check,
  Copy,
  Search,
  Users,
  Shield,
  LifeBuoy,
  PenSquare,
  User,
  UserPlus,
  RefreshCw,
  CreditCard,
  Activity,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiClient } from "@/lib/api/api-client";
import type { UserWithDetailsDTO } from "@/shared/types/user.types";
import { UserRole } from "@/shared/enums/user-role.enum";
import { GithubIcon, GoogleIcon } from "../ui/icons";
import { UserActions } from "./user-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { UserAddDialog } from "./user-add-dialog";
import { useLocale, useTranslations } from "next-intl";
import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";
import { PLAN_CONFIG } from "@/server/modules/subscriptions/subscription-entitlements";

// Helper function to render account icons
const getAccountIcon = (account: string) => {
  switch (account) {
    case "credential":
      return <Mail className="h-4 w-4 dark:text-neutral-300" />;
    case "github":
      return <GithubIcon className="h-4 w-4 dark:text-neutral-300" />;
    case "google":
      return <GoogleIcon className="h-4 w-4 dark:text-neutral-300" />;
    default:
      return null;
  }
};

export function UsersTable() {
  const t = useTranslations("adminUsers");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Filters and sort state, initialized from URL
  const [role, setRole] = useState(searchParams.get("role") || "all");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [subscriptionPlan, setSubscriptionPlan] = useState(
    searchParams.get("subscriptionPlan") || "all",
  );
  const [subscriptionStatus, setSubscriptionStatus] = useState(
    searchParams.get("subscriptionStatus") || "all",
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sortBy") || "createdAt",
  );
  const [sortDirection, setSortDirection] = useState(
    searchParams.get("sortDirection") || "desc",
  );
  const [debouncedEmail, setDebouncedEmail] = useState(email);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const limit = 10;

  // Debounce email search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmail(email);
    }, 300);

    return () => clearTimeout(timer);
  }, [email]);

  // Update URL when filters/sort/page change
  useEffect(() => {
    const params = new URLSearchParams();
    if (role && role !== "all") params.set("role", role);
    if (debouncedEmail) params.set("email", debouncedEmail);
    if (subscriptionPlan && subscriptionPlan !== "all") {
      params.set("subscriptionPlan", subscriptionPlan);
    }
    if (subscriptionStatus && subscriptionStatus !== "all") {
      params.set("subscriptionStatus", subscriptionStatus);
    }
    if (sortBy) params.set("sortBy", sortBy);
    if (sortDirection) params.set("sortDirection", sortDirection);
    if (page) params.set("page", String(page));
    params.set("limit", String(limit));
    router.replace(`?${params.toString()}`);
  }, [
    role,
    debouncedEmail,
    subscriptionPlan,
    subscriptionStatus,
    sortBy,
    sortDirection,
    page,
    router,
  ]);

  const swrKey = useMemo(
    () =>
      [
        "admin-users",
        role,
        debouncedEmail,
        subscriptionPlan,
        subscriptionStatus,
        sortBy,
        sortDirection,
        page,
        limit,
      ] as const,
    [
      role,
      debouncedEmail,
      subscriptionPlan,
      subscriptionStatus,
      sortBy,
      sortDirection,
      page,
      limit,
    ],
  );

  const { data, error, mutate, isLoading } = useSWR(
    swrKey,
    ([
      ,
      keyRole,
      keyEmail,
      keySubscriptionPlan,
      keySubscriptionStatus,
      keySortBy,
      keySortDirection,
      keyPage,
      keyLimit,
    ]) =>
      apiClient.users.list({
        role: keyRole !== "all" ? (keyRole as UserRole) : undefined,
        email: keyEmail || undefined,
        subscriptionPlan:
          keySubscriptionPlan !== "all"
            ? (keySubscriptionPlan as SubscriptionPlanEnum)
            : undefined,
        subscriptionStatus:
          keySubscriptionStatus !== "all"
            ? (keySubscriptionStatus as "active" | "inactive")
            : undefined,
        sortBy: keySortBy as
          | "name"
          | "email"
          | "role"
          | "segmentId"
          | "createdAt"
          | "updatedAt",
        sortDirection: keySortDirection as "asc" | "desc",
        page: keyPage,
        limit: keyLimit,
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    },
  );

  const handleActionComplete = () => {
    mutate();
  };

  const handleCopyUserId = async (userId: string) => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopiedUserId(userId);
      window.setTimeout(() => setCopiedUserId(null), 1500);
    } catch {
      // no-op
    }
  };

  // Filter and sort controls
  const filterControls = (
    <div className="flex flex-wrap gap-2 items-end mb-2 w-full justify-between">
      <div className="flex flex-wrap gap-2 items-end">
        {/* Search by email */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("controls.searchEmail")}
            className="pl-8 pr-2 py-2 border rounded-md text-sm bg-background w-50"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {/* Role select with icon */}
        <Select
          value={role}
          onValueChange={(v) => {
            setRole(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder={t("controls.allRoles")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t("controls.allRoles")}
              </span>
            </SelectItem>
            <SelectItem value="admin">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {t("controls.admin")}
              </span>
            </SelectItem>
            <SelectItem value="support">
              <span className="flex items-center gap-2">
                <LifeBuoy className="w-4 h-4" />
                {t("controls.support")}
              </span>
            </SelectItem>
            <SelectItem value="content_manager">
              <span className="flex items-center gap-2">
                <PenSquare className="w-4 h-4" />
                {t("controls.contentManager")}
              </span>
            </SelectItem>
            <SelectItem value="user">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {t("controls.user")}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Subscription Plan select */}
        <Select
          value={subscriptionPlan}
          onValueChange={(v) => {
            setSubscriptionPlan(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t("controls.allPlans")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {t("controls.allPlans")}
              </span>
            </SelectItem>
            <SelectItem value={SubscriptionPlanEnum.FREE}>
              <span className="flex items-center gap-2">
                {PLAN_CONFIG[SubscriptionPlanEnum.FREE].emoji && (
                  <span>{PLAN_CONFIG[SubscriptionPlanEnum.FREE].emoji}</span>
                )}
                {locale.startsWith("ar")
                  ? PLAN_CONFIG[SubscriptionPlanEnum.FREE].displayName.ar
                  : PLAN_CONFIG[SubscriptionPlanEnum.FREE].displayName.en}
              </span>
            </SelectItem>
            <SelectItem value={SubscriptionPlanEnum.TRIAL}>
              <span className="flex items-center gap-2">
                {PLAN_CONFIG[SubscriptionPlanEnum.TRIAL].emoji && (
                  <span>{PLAN_CONFIG[SubscriptionPlanEnum.TRIAL].emoji}</span>
                )}
                {locale.startsWith("ar")
                  ? PLAN_CONFIG[SubscriptionPlanEnum.TRIAL].displayName.ar
                  : PLAN_CONFIG[SubscriptionPlanEnum.TRIAL].displayName.en}
              </span>
            </SelectItem>
            <SelectItem value={SubscriptionPlanEnum.PRO}>
              <span className="flex items-center gap-2">
                {PLAN_CONFIG[SubscriptionPlanEnum.PRO].emoji && (
                  <span>{PLAN_CONFIG[SubscriptionPlanEnum.PRO].emoji}</span>
                )}
                {locale.startsWith("ar")
                  ? PLAN_CONFIG[SubscriptionPlanEnum.PRO].displayName.ar
                  : PLAN_CONFIG[SubscriptionPlanEnum.PRO].displayName.en}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Subscription Activity select */}
        <Select
          value={subscriptionStatus}
          onValueChange={(v) => {
            setSubscriptionStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t("controls.allSubscriptionActivity")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {t("controls.allSubscriptionActivity")}
              </span>
            </SelectItem>
            <SelectItem value="active">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                {t("controls.subscriptionActive")}
              </span>
            </SelectItem>
            <SelectItem value="inactive">
              <span className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-muted-foreground" />
                {t("controls.subscriptionInactive")}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(value) => {
            setSortBy(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("controls.sortBy")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">
              {t("controls.sortCreatedAt")}
            </SelectItem>
            <SelectItem value="segmentId">
              {t("controls.sortSegment")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortDirection}
          onValueChange={(value) => {
            setSortDirection(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder={t("controls.sortDirection")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">{t("controls.sortDesc")}</SelectItem>
            <SelectItem value="asc">{t("controls.sortAsc")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2 ms-auto">
        <button
          className="bg-secondary cursor-pointer text-secondary-foreground rounded-md px-3 py-2 text-sm font-medium shadow-xs hover:bg-secondary/90 transition-colors flex items-center gap-2"
          onClick={() => mutate()}
          type="button"
        >
          <RefreshCw className="h-4 w-4 " />
          Refresh
        </button>
        <button
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium shadow-xs hover:bg-primary/90 transition-colors flex items-center gap-2"
          onClick={() => setIsAddDialogOpen(true)}
          type="button"
        >
          <UserPlus className="h-4 w-4" />
          {t("controls.addUser")}
        </button>
      </div>
    </div>
  );

  if (error) return <div>{t("errors.failedToLoadUsers")}</div>;
  if (!isHydrated || !data)
    return (
      <div className="space-y-4 border-accent-foreground">
        {filterControls}
        <div className="overflow-hidden">
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                {[
                  { label: "ID" },
                  { label: t("columns.name") },
                  { label: t("columns.verification") },
                  { label: t("columns.linkedAccounts") },
                  { label: t("columns.role") },
                  { label: t("columns.segment") },
                  { label: t("columns.plan") },
                  { label: t("columns.planActive") },
                  { label: t("columns.status") },
                  { label: t("columns.lastSignIn") },
                  { label: t("columns.createdAt") },
                  { label: t("columns.actions"), className: "w-[80px]" },
                ].map((col) => (
                  <TableHead
                    key={col.label}
                    className={[
                      col.className,
                      "px-4 py-3 text-xs font-medium text-muted-foreground",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-30" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex -space-x-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-8 rounded-full" />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-6 w-15" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-6 w-24" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-6 w-24" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-35" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-35" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );

  const users = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 0;

  // Pagination logic for shadcn/ui Pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);
    if (endPage - startPage < maxPagesToShow - 1) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-disabled={page === 1}
              tabIndex={page === 1 ? -1 : 0}
              className={page === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
              </PaginationItem>
              {startPage > 2 && <PaginationEllipsis />}
            </>
          )}
          {pageNumbers.map((pNum) => (
            <PaginationItem key={pNum}>
              <PaginationLink
                isActive={pNum === page}
                onClick={() => setPage(pNum)}
              >
                {pNum}
              </PaginationLink>
            </PaginationItem>
          ))}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationLink onClick={() => setPage(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-disabled={page === totalPages}
              tabIndex={page === totalPages ? -1 : 0}
              className={
                page === totalPages ? "pointer-events-none opacity-50" : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="space-y-4">
      {filterControls}
      <div className="overflow-hidden rounded-lg border-muted border-2 ">
        <Table className="text-sm ">
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              {[
                { label: "ID" },
                { label: t("columns.name") },
                { label: t("columns.verification") },
                { label: t("columns.linkedAccounts") },
                { label: t("columns.role") },
                { label: t("columns.segment") },
                { label: t("columns.plan") },
                { label: t("columns.planActive") },
                { label: t("columns.status") },
                { label: t("columns.lastSignIn") },
                { label: t("columns.createdAt") },
                { label: t("columns.actions"), className: "w-[80px]" },
              ].map((col) => (
                <TableHead
                  key={col.label}
                  className={[
                    col.className,
                    "px-4 py-3 text-xs font-medium text-muted-foreground",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-30" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex -space-x-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <Skeleton key={i} className="h-8 w-8 rounded-full" />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-6 w-15" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-4 w-35" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-4 w-35" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              : users.map((user: UserWithDetailsDTO) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleCopyUserId(user.id)}
                        className="inline-flex items-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        aria-label="Copy user ID"
                        title={
                          copiedUserId === user.id
                            ? "Copied user ID"
                            : "Copy user ID"
                        }
                      >
                        {copiedUserId === user.id ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <Avatar>
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
                          <span className="text-xs text-muted-foreground">
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
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {user.emailVerified ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700 flex items-center gap-1 px-2 py-1 text-xs"
                        >
                          <CheckCircle className="h-3 w-3" />
                          {t("statuses.verified")}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700 flex items-center gap-1 px-2 py-1 text-xs"
                        >
                          <XCircle className="h-3 w-3" />
                          {t("statuses.unverified")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex -space-x-2">
                        {user.accounts.map((account) => (
                          <div
                            key={account}
                            className="rounded-full bg-muted p-1.5 text-muted-foreground dark:bg-neutral-700"
                            title={account}
                          >
                            {getAccountIcon(account)}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 px-2 py-1 text-xs ${
                          user.role === UserRole.ADMIN
                            ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700"
                            : user.role === UserRole.CONTENT_MANAGER
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700"
                              : user.role === UserRole.SUPPORT
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700"
                                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700"
                        }`}
                      >
                        {user.role === UserRole.ADMIN ? (
                          <Shield className="h-3 w-3" />
                        ) : user.role === UserRole.CONTENT_MANAGER ? (
                          <PenSquare className="h-3 w-3" />
                        ) : user.role === UserRole.SUPPORT ? (
                          <LifeBuoy className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        {user.role
                          ? user.role === UserRole.ADMIN
                            ? t("roles.admin")
                            : user.role === UserRole.CONTENT_MANAGER
                              ? t("roles.contentManager")
                              : user.role === UserRole.SUPPORT
                                ? t("roles.support")
                                : t("roles.user")
                          : t("roles.user")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {user.segment ? (
                        <Badge
                          variant="outline"
                          className="flex w-fit items-center gap-1 px-2 py-1 text-xs"
                        >
                          <span>{user.segment.icon}</span>
                          <span>{user.segment.name}</span>
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {t("statuses.noSegment")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {(() => {
                        const plan =
                          user.subscription?.plan ?? SubscriptionPlanEnum.FREE;
                        const planConfig = PLAN_CONFIG[plan];
                        const planLabel = locale.startsWith("ar")
                          ? planConfig.displayName.ar
                          : planConfig.displayName.en;

                        return (
                          <Badge
                            variant="outline"
                            className="flex w-fit items-center gap-1 px-2 py-1 text-xs"
                          >
                            <span>{planConfig.emoji}</span>
                            <span>{planLabel}</span>
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {(() => {
                        const isPlanActive = user.subscription
                          ? new Date(user.subscription.planExpiresAt) >
                            new Date()
                          : true;
                        return isPlanActive ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700 flex items-center gap-1 px-2 py-1 text-xs"
                          >
                            <CheckCircle className="h-3 w-3" />
                            {t("statuses.planActive")}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 flex items-center gap-1 px-2 py-1 text-xs"
                          >
                            <XCircle className="h-3 w-3" />
                            {t("statuses.planInactive")}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {user.banned ? (
                        <div className="flex flex-col gap-1">
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="destructive"
                                  className="flex items-center gap-1 px-2 py-1 text-xs cursor-help"
                                >
                                  <Ban className="h-3 w-3" />
                                  {t("statuses.banned")}
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
                            <span className="text-xs text-muted-foreground">
                              Expires:{" "}
                              {format(new Date(user.banExpires), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700 flex items-center gap-1 px-2 py-1 text-xs"
                        >
                          <Check className="h-3 w-3" />
                          {t("statuses.active")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                      {user.lastSignIn
                        ? format(
                            new Date(user.lastSignIn),
                            "MMM d, yyyy 'at' h:mm a",
                          )
                        : t("statuses.never")}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                      {format(
                        new Date(user.createdAt),
                        "MMM d, yyyy 'at' h:mm a",
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <UserActions
                        user={user}
                        onActionComplete={handleActionComplete}
                      />
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4 py-1">
        <div className="text-sm text-muted-foreground">
          {t("summary", { count: users.length, total })}
        </div>
        {renderPagination()}
      </div>
      <UserAddDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
