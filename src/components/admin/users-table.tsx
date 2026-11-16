"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import useSWR from "swr";
import {
  Check,
  Copy,
  GraduationCap,
  LifeBuoy,
  PenSquare,
  Phone,
  Search,
  Shield,
  User,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable, DataTableRefreshButton } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api/api-client";
import { UserRole } from "@/shared/enums/user-role.enum";
import type { UserWithDetailsDTO } from "@/shared/types/user.types";
import { UserActions } from "./user-actions";
import { UserAddDialog } from "./user-add-dialog";
import {
  getAccountIcon,
  useUserColumns,
  UserRoleBadge,
  UserSegmentBadge,
  UserStatusBadge,
  UserVerificationBadge,
} from "./users-table-columns";

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
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") || searchParams.get("email") || "",
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sortBy") || "createdAt",
  );
  const [sortDirection, setSortDirection] = useState(
    searchParams.get("sortDirection") || "desc",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const limit = 10;

  // Debounce search input (name, email, or phone)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL when filters/sort/page change
  useEffect(() => {
    const params = new URLSearchParams();
    if (role && role !== "all") params.set("role", role);
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortDirection) params.set("sortDirection", sortDirection);
    if (page) params.set("page", String(page));
    params.set("limit", String(limit));
    router.replace(`?${params.toString()}`);
  }, [role, debouncedSearch, sortBy, sortDirection, page, router]);

  const swrKey = useMemo(
    () =>
      [
        "admin-users",
        role,
        debouncedSearch,
        sortBy,
        sortDirection,
        page,
        limit,
      ] as const,
    [role, debouncedSearch, sortBy, sortDirection, page, limit],
  );

  const { data, error, mutate, isLoading, isValidating } = useSWR(
    swrKey,
    ([, keyRole, keySearch, keySortBy, keySortDirection, keyPage, keyLimit]) =>
      apiClient.users.list({
        role: keyRole !== "all" ? (keyRole as UserRole) : undefined,
        q: keySearch || undefined,
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

  const handleActionComplete = useCallback(() => {
    mutate();
  }, [mutate]);

  const handleCopyUserId = useCallback(async (userId: string) => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopiedUserId(userId);
      window.setTimeout(() => setCopiedUserId(null), 1500);
    } catch {
      // no-op
    }
  }, []);

  const columns = useUserColumns({
    dateLocale,
    copiedUserId,
    onCopyUserId: handleCopyUserId,
    onActionComplete: handleActionComplete,
  });

  const users = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 0;

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
            placeholder={t("controls.searchUsers")}
            className="w-full ps-8 pe-8 py-2 border rounded-md text-sm bg-background transition-colors focus:ring-1 focus:ring-primary focus:outline-none"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <DataTableRefreshButton
            onRefresh={() => mutate()}
            isRefreshing={isValidating}
            label={t("controls.refresh")}
            className="flex-1 sm:flex-none justify-center px-3 py-2 text-sm font-medium"
          />
          <button
            className="flex-1 sm:flex-none justify-center bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium shadow-xs hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer"
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

  // Mobile adaptive card renderer (< md)
  const renderMobileCard = (user: UserWithDetailsDTO) => {
    const isCopied = copiedUserId === user.id;

    return (
      <div
        key={user.id}
        className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs space-y-3 hover:border-border transition-colors"
      >
        {/* Card Header: Avatar, Name, Email, Phone + UserActions Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <Avatar className="h-10 w-10 shrink-0 mt-0.5">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
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
            </div>
          </div>

          {/* Actions Trigger Dropdown */}
          <div className="shrink-0 -me-1 -mt-0.5">
            <UserActions user={user} onActionComplete={handleActionComplete} />
          </div>
        </div>

        {/* Dedicated Phone Row */}
        {user.phone ? (
          <div
            className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md w-fit font-mono"
            dir="ltr"
          >
            <Phone className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
            <a
              href={`tel:${user.phone}`}
              className="hover:underline hover:text-foreground"
            >
              {user.phone}
            </a>
          </div>
        ) : null}

        {/* Status & Category Badges Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <UserRoleBadge role={user.role} />
          <UserStatusBadge user={user} dateLocale={dateLocale} />
          <UserVerificationBadge emailVerified={user.emailVerified} />
          <UserSegmentBadge segment={user.segment} />
        </div>

        {/* Card Footer: One-tap Copy ID, Linked Accounts, Created Date */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopyUserId(user.id)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors font-mono text-[11px] cursor-pointer"
              aria-label={t("actions.copyUserId")}
              title={
                isCopied ? t("actions.copiedUserId") : t("actions.copyUserId")
              }
            >
              {isCopied ? (
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
    );
  };

  if (error) return <div>{t("errors.failedToLoadUsers")}</div>;

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        isHydrated={isHydrated}
        toolbar={filterControls}
        renderMobileCard={renderMobileCard}
        page={page}
        totalPages={totalPages}
        totalCount={total}
        onPageChange={setPage}
        paginationLabels={{
          previous: t("pagination.previous"),
          next: t("pagination.next"),
          previousAria: t("pagination.previousAria"),
          nextAria: t("pagination.nextAria"),
          summary: t("summary", { count: users.length, total }),
        }}
        emptyMessage={
          t("errors.failedToLoadUsers") ? "لا يوجد مستخدمون" : "No users found"
        }
        emptyIcon={
          <Users className="h-10 w-10 mx-auto text-muted-foreground/50" />
        }
      />

      {/* Create User Dialog */}
      <UserAddDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={() => mutate()}
      />
    </>
  );
}
