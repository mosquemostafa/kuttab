"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import { Phone, Plus, Search, UserCheck, Users, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DataTable, DataTableRefreshButton } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api/api-client";
import { TeacherStatus } from "@/shared/enums/teacher-status.enum";
import { TeacherStudentType } from "@/shared/enums/teacher-student-type.enum";
import type { TeacherDTO } from "@/shared/types/teacher.types";
import { TeacherActions } from "./teacher-actions";
import {
  TeacherStatusBadge,
  TeacherStudentTypeBadge,
  useTeacherColumns,
} from "./teacher-columns";
import { TeacherDetailsDialog } from "./teacher-details-dialog";
import { TeacherFormDialog } from "./teacher-form-dialog";

export function TeachersTable() {
  const t = useTranslations("adminTeachers");
  const locale = useLocale();
  const dateLocale = locale.startsWith("ar") ? ar : enUS;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Filter and search state from URL
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") || searchParams.get("search") || "",
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all",
  );
  const [studentTypeFilter, setStudentTypeFilter] = useState(
    searchParams.get("studentType") || "all",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const limit = 10;

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeacherForEdit, setSelectedTeacherForEdit] =
    useState<TeacherDTO | null>(null);
  const [selectedTeacherForDetails, setSelectedTeacherForDetails] =
    useState<TeacherDTO | null>(null);
  const [pendingDeleteTeacher, setPendingDeleteTeacher] =
    useState<TeacherDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // URL sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);
    if (studentTypeFilter && studentTypeFilter !== "all")
      params.set("studentType", studentTypeFilter);
    if (page) params.set("page", String(page));
    params.set("limit", String(limit));
    router.replace(`?${params.toString()}`);
  }, [debouncedSearch, statusFilter, studentTypeFilter, page, limit, router]);

  // Fetch teachers list
  const swrKey = useMemo(
    () =>
      [
        "admin-teachers",
        debouncedSearch,
        statusFilter,
        studentTypeFilter,
        page,
        limit,
      ] as const,
    [debouncedSearch, statusFilter, studentTypeFilter, page, limit],
  );

  const { data, error, mutate, isLoading, isValidating } = useSWR(
    swrKey,
    ([, qVal, statusVal, typeVal, pageVal, limitVal]) =>
      apiClient.teachers.list({
        q: qVal || undefined,
        status: statusVal !== "all" ? (statusVal as TeacherStatus) : undefined,
        studentType:
          typeVal !== "all" ? (typeVal as TeacherStudentType) : undefined,
        page: pageVal,
        limit: limitVal,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    },
  );

  const teachers = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 0;

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!pendingDeleteTeacher) return;
    try {
      setIsDeleting(true);
      await apiClient.teachers.delete(pendingDeleteTeacher.id);
      toast.success(t("toasts.deleted"));
      mutate();
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setIsDeleting(false);
      setPendingDeleteTeacher(null);
    }
  };

  const columns = useTeacherColumns({
    dateLocale,
    onEdit: (teacher) => {
      setSelectedTeacherForEdit(teacher);
      setIsFormOpen(true);
    },
    onDelete: (teacher) => setPendingDeleteTeacher(teacher),
    onViewDetails: (teacher) => setSelectedTeacherForDetails(teacher),
  });

  // Top Filter Controls Toolbar
  const filterControls = (
    <div className="flex flex-col gap-3 mb-4 w-full">
      {/* Row 1: Search + Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={t("controls.search")}
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

        <div className="flex items-center gap-2 shrink-0">
          <DataTableRefreshButton
            onRefresh={() => mutate()}
            isRefreshing={isValidating}
            label={t("controls.refresh")}
            className="flex-1 sm:flex-none justify-center px-3 py-2 text-sm font-medium"
          />
          <Button
            onClick={() => {
              setSelectedTeacherForEdit(null);
              setIsFormOpen(true);
            }}
            className="flex-1 sm:flex-none justify-center gap-1.5 px-4 py-2 text-sm font-medium cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t("controls.addTeacher")}</span>
          </Button>
        </div>
      </div>

      {/* Row 2: Status & Teaching Track Filters */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
        {/* Status Select */}
        <div className="col-span-1 sm:w-44">
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("controls.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("controls.allStatuses")}</SelectItem>
              <SelectItem value={TeacherStatus.ACTIVE}>
                {t("statuses.active")}
              </SelectItem>
              <SelectItem value={TeacherStatus.ARCHIVED}>
                {t("statuses.archived")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Teaching Track Select */}
        <div className="col-span-1 sm:w-52">
          <Select
            value={studentTypeFilter}
            onValueChange={(val) => {
              setStudentTypeFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("controls.allStudentTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("controls.allStudentTypes")}
              </SelectItem>
              <SelectItem value={TeacherStudentType.FOUNDATION}>
                {t("studentTypes.foundation")}
              </SelectItem>
              <SelectItem value={TeacherStudentType.KHATIMEEN}>
                {t("studentTypes.khatimeen")}
              </SelectItem>
              <SelectItem value={TeacherStudentType.CHILDREN}>
                {t("studentTypes.children")}
              </SelectItem>
              <SelectItem value={TeacherStudentType.ADULTS}>
                {t("studentTypes.adults")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  // Mobile Adaptive Card View (< md)
  const renderMobileCard = (teacher: TeacherDTO) => {
    return (
      <div
        key={teacher.id}
        className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs space-y-3 hover:border-border transition-colors"
      >
        {/* Header: Icon, Name + TeacherActions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex flex-col">
              <button
                type="button"
                onClick={() => setSelectedTeacherForDetails(teacher)}
                className="text-start font-semibold text-sm text-foreground hover:underline cursor-pointer truncate"
              >
                {teacher.name}
              </button>
            </div>
          </div>

          <div className="shrink-0 -me-1 -mt-0.5">
            <TeacherActions
              teacher={teacher}
              onEdit={(teacherItem) => {
                setSelectedTeacherForEdit(teacherItem);
                setIsFormOpen(true);
              }}
              onDelete={(teacherItem) => setPendingDeleteTeacher(teacherItem)}
              onViewDetails={(teacherItem) =>
                setSelectedTeacherForDetails(teacherItem)
              }
            />
          </div>
        </div>

        {/* Dedicated Phone Row */}
        {teacher.phone ? (
          <div
            className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md w-fit font-mono"
            dir="ltr"
          >
            <Phone className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
            <a
              href={`tel:${teacher.phone}`}
              className="hover:underline hover:text-foreground"
            >
              {teacher.phone}
            </a>
          </div>
        ) : null}

        {/* Badges Strip */}
        <div className="flex flex-wrap items-center gap-1.5">
          <TeacherStatusBadge status={teacher.status} />
          <TeacherStudentTypeBadge type={teacher.studentType} />
        </div>

        {/* Card Footer: Date Added */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
          <span>{t("columns.createdAt")}</span>
          <span className="text-[11px] text-muted-foreground/80">
            {teacher.createdAt
              ? format(new Date(teacher.createdAt), "PP", {
                  locale: dateLocale,
                })
              : "—"}
          </span>
        </div>
      </div>
    );
  };

  if (error) return <div>{t("toasts.loadFailed")}</div>;

  return (
    <>
      <DataTable
        columns={columns}
        data={teachers}
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
          summary: t("summary", { count: teachers.length, total }),
        }}
        emptyMessage={t("empty")}
        emptyIcon={
          <Users className="h-10 w-10 mx-auto text-muted-foreground/50" />
        }
      />

      {/* Create / Edit Dialog */}
      <TeacherFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedTeacherForEdit(null);
        }}
        onSuccess={() => mutate()}
        teacher={selectedTeacherForEdit}
      />

      {/* Details Profile Dialog */}
      <TeacherDetailsDialog
        isOpen={Boolean(selectedTeacherForDetails)}
        onClose={() => setSelectedTeacherForDetails(null)}
        teacher={selectedTeacherForDetails}
        onEdit={(teacher) => {
          setSelectedTeacherForDetails(null);
          setSelectedTeacherForEdit(teacher);
          setIsFormOpen(true);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteTeacher)}
        onClose={() => setPendingDeleteTeacher(null)}
        onConfirm={handleDeleteConfirm}
        title={t("dialogs.deleteTitle", {
          name: pendingDeleteTeacher?.name ?? "",
        })}
        description={t("dialogs.deleteDescription")}
        confirmText={
          isDeleting ? t("dialogs.saving") : t("dialogs.deleteConfirm")
        }
        cancelText={t("dialogs.cancel")}
        confirmVariant="destructive"
      />
    </>
  );
}
