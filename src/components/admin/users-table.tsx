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
  Phone,
  GraduationCap,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiClient } from "@/lib/api/api-client";
import type { UserWithDetailsDTO } from "@/shared/types/user.types";
import { UserRole } from "@/shared/enums/user-role.enum";
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

// Helper function to render account icons
const getAccountIcon = (account: string) => {
  switch (account) {
    case "credential":
      return <Mail className="h-3.5 w-3.5 dark:text-neutral-300" />;
    default:
      return <Mail className="h-3.5 w-3.5 dark:text-neutral-300" />;
  }
};

export function UsersTable() {
  const t = useTranslations("adminUsers");
  const locale = useLocale();
  const dateLocale = locale.startsWith("ar") ? ar : enUS;
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
    if (sortBy) params.set("sortBy", sortBy);
    if (sortDirection) params.set("sortDirection", sortDirection);
    if (page) params.set("page", String(page));
    params.set("limit", String(limit));
    router.replace(`?${params.toString()}`);
  }, [role, debouncedEmail, sortBy, sortDirection, page, router]);

  const swrKey = useMemo(
    () =>
      [
        "admin-users",
        role,
        debouncedEmail,
        sortBy,
        sortDirection,
        page,
        limit,
      ] as const,
    [role, debouncedEmail, sortBy, sortDirection, page, limit],
  );

  const { data, error, mutate, isLoading } = useSWR(
    swrKey,
    ([, keyRole, keyEmail, keySortBy, keySortDirection, keyPage, keyLimit]) =>
      apiClient.users.list({
        role: keyRole !== "all" ? (keyRole as UserRole) : undefined,
        email: keyEmail || undefined,
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

  // Reusable badge renderers
  const renderRoleBadge = (userRole: UserRole | string | null | undefined) => {
    const getBadgeStyle = () => {
      switch (userRole) {
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
      switch (userRole) {
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
      switch (userRole) {
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
  };

  const renderVerificationBadge = (emailVerified: boolean) => {
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
  };

  const renderStatusBadge = (user: UserWithDetailsDTO) => {
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
  };

  const renderSegmentBadge = (segment: UserWithDetailsDTO["segment"]) => {
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
  };

  // Filter and sort controls - optimized for both mobile & desktop
  const filterControls = (
    <div className="flex flex-col gap-3 mb-4 w-full">
      {/* Row 1: Search + Main Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search input with clear button */}
        <div className="relative flex-1">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={t("controls.searchEmail")}
            className="w-full ps-8 pe-8 py-2 border rounded-md text-sm bg-background transition-colors focus:ring-1 focus:ring-primary focus:outline-none"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setPage(1);
            }}
          />
          {email && (
            <button
              type="button"
              onClick={() => {
                setEmail("");
                setPage(1);
              }}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full transition-colors"
              aria-label="Clear search"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="flex-1 sm:flex-none justify-center bg-secondary cursor-pointer text-secondary-foreground rounded-md px-3 py-2 text-sm font-medium shadow-xs hover:bg-secondary/90 transition-colors flex items-center gap-2"
            onClick={() => mutate()}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{t("controls.refresh")}</span>
          </button>
          <button
            className="flex-1 sm:flex-none justify-center bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium shadow-xs hover:bg-primary/90 transition-colors flex items-center gap-2"
            onClick={() => setIsAddDialogOpen(true)}
            type="button"
          >
            <UserPlus className="h-4 w-4" />
            <span>{t("controls.addUser")}</span>
          </button>
        </div>
      </div>

      {/* Row 2: Filter by Role, Sort By, Sort Direction */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
        {/* Role Select */}
        <div className="col-span-2 sm:col-auto sm:w-44">
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
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
              <SelectItem value="content">
                <span className="flex items-center gap-2">
                  <PenSquare className="w-4 h-4" />
                  {t("controls.content")}
                </span>
              </SelectItem>
              <SelectItem value="student">
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {t("controls.student")}
                </span>
              </SelectItem>
              <SelectItem value="parent">
                <span className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  {t("controls.parent")}
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
        </div>

        {/* Sort By Select */}
        <div className="sm:w-40">
          <Select
            value={sortBy}
            onValueChange={(value) => {
              setSortBy(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
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
        </div>

        {/* Sort Direction Select */}
        <div className="sm:w-32">
          <Select
            value={sortDirection}
            onValueChange={(value) => {
              setSortDirection(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("controls.sortDirection")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">{t("controls.sortDesc")}</SelectItem>
              <SelectItem value="asc">{t("controls.sortAsc")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  // Skeletons for Loading State
  const skeletonContent = (
    <div className="space-y-4">
      {filterControls}

      {/* Mobile Card Skeletons (md:hidden) */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/80 bg-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Skeletons (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto rounded-lg border-muted border-2">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              {[
                { label: t("columns.id") },
                { label: t("columns.name") },
                { label: t("columns.verification") },
                { label: t("columns.linkedAccounts") },
                { label: t("columns.role") },
                { label: t("columns.segment") },
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
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
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

  if (error) return <div>{t("errors.failedToLoadUsers")}</div>;
  if (!isHydrated || !data) return skeletonContent;

  const users = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 0;

  // Pagination logic: compact on mobile, full on desktop
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
        {/* Mobile Compact Pagination (< sm) */}
        <div className="flex sm:hidden items-center justify-between w-full gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs"
          >
            {t("pagination.previous")}
          </Button>
          <span className="text-xs text-muted-foreground font-medium">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-xs"
          >
            {t("pagination.next")}
          </Button>
        </div>

        {/* Desktop Full Pagination (>= sm) */}
        <PaginationContent className="hidden sm:flex">
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-disabled={page === 1}
              tabIndex={page === 1 ? -1 : 0}
              className={page === 1 ? "pointer-events-none opacity-50" : ""}
              text={t("pagination.previous")}
              ariaLabel={t("pagination.previousAria")}
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
              text={t("pagination.next")}
              ariaLabel={t("pagination.nextAria")}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="space-y-4">
      {filterControls}

      {/* Loading state indicator during background SWR revalidation */}
      {isLoading && (
        <div className="py-2 text-center text-xs text-muted-foreground animate-pulse">
          {t("controls.refresh")}…
        </div>
      )}

      {/* Empty State */}
      {users.length === 0 && !isLoading && (
        <div className="text-center py-12 px-4 border rounded-xl bg-card text-muted-foreground space-y-2">
          <Users className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <p className="text-sm font-medium">
            {t("errors.failedToLoadUsers")
              ? "لا يوجد مستخدمون"
              : "No users found"}
          </p>
        </div>
      )}

      {/* MOBILE ADAPTIVE VIEW (< md): Touch-Friendly Cards */}
      {users.length > 0 && (
        <div className="md:hidden space-y-3">
          {users.map((user: UserWithDetailsDTO) => (
            <div
              key={user.id}
              className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs space-y-3 hover:border-border transition-colors"
            >
              {/* Card Header: Avatar, Name, Email, Phone + UserActions Menu */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Avatar className="h-10 w-10 shrink-0 mt-0.5">
                    <AvatarImage
                      src={user.avatarUrl ?? undefined}
                      alt={user.name}
                    />
                    <AvatarFallback className="text-xs font-medium">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex flex-col">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {user.name}
                    </span>
                    <span
                      className="text-xs text-muted-foreground truncate"
                      dir="ltr"
                    >
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

                {/* Actions Trigger Dropdown */}
                <div className="shrink-0 -me-1 -mt-0.5">
                  <UserActions
                    user={user}
                    onActionComplete={handleActionComplete}
                  />
                </div>
              </div>

              {/* Status & Category Badges Row */}
              <div className="flex flex-wrap items-center gap-1.5">
                {renderRoleBadge(user.role)}
                {renderStatusBadge(user)}
                {renderVerificationBadge(user.emailVerified)}
                {renderSegmentBadge(user.segment)}
              </div>

              {/* Card Footer: One-tap Copy ID, Linked Accounts, Created Date */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyUserId(user.id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors font-mono text-[11px]"
                    aria-label={t("actions.copyUserId")}
                    title={
                      copiedUserId === user.id
                        ? t("actions.copiedUserId")
                        : t("actions.copyUserId")
                    }
                  >
                    {copiedUserId === user.id ? (
                      <>
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        <span>{t("actions.copiedUserId")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>{user.id.slice(0, 8)}…</span>
                      </>
                    )}
                  </button>

                  {user.accounts.length > 0 && (
                    <div
                      className="flex -space-x-1.5"
                      title={user.accounts.join(", ")}
                    >
                      {user.accounts.map((account) => (
                        <div
                          key={account}
                          className="rounded-full bg-muted p-1 text-muted-foreground dark:bg-neutral-700"
                        >
                          {getAccountIcon(account)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-[11px] text-muted-foreground/80">
                  {format(new Date(user.createdAt), "PP", {
                    locale: dateLocale,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DESKTOP TABLE VIEW (>= md): Full 10-Column Data Table */}
      {users.length > 0 && (
        <div className="hidden md:block overflow-x-auto rounded-lg border-muted border-2">
          <Table className="text-sm">
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                {[
                  { label: t("columns.id") },
                  { label: t("columns.name") },
                  { label: t("columns.verification") },
                  { label: t("columns.linkedAccounts") },
                  { label: t("columns.role") },
                  { label: t("columns.segment") },
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
              {users.map((user: UserWithDetailsDTO) => (
                <TableRow key={user.id}>
                  <TableCell className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleCopyUserId(user.id)}
                      className="inline-flex items-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      aria-label={t("actions.copyUserId")}
                      title={
                        copiedUserId === user.id
                          ? t("actions.copiedUserId")
                          : t("actions.copyUserId")
                      }
                    >
                      {copiedUserId === user.id ? (
                        <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="px-4 py-3">
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
                        <span
                          className="text-xs text-muted-foreground"
                          dir="ltr"
                        >
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
                    {renderVerificationBadge(user.emailVerified)}
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
                    {renderRoleBadge(user.role)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {renderSegmentBadge(user.segment)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {renderStatusBadge(user)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                    {user.lastSignIn
                      ? format(new Date(user.lastSignIn), "PPp", {
                          locale: dateLocale,
                        })
                      : t("statuses.never")}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                    {format(new Date(user.createdAt), "PPp", {
                      locale: dateLocale,
                    })}
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
      )}

      {/* Pagination & Summary Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 sm:px-4 py-1">
        <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
          {t("summary", { count: users.length, total })}
        </div>
        <div className="order-1 sm:order-2 w-full sm:w-auto flex justify-center">
          {renderPagination()}
        </div>
      </div>

      {/* Create User Dialog */}
      <UserAddDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
