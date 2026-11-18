"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import { Plus, Search, User, Users, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DataTable, DataTableRefreshButton } from "@/components/ui/data-table";
import { RelationSelect } from "@/components/ui/relation-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api/api-client";
import { ClassType } from "@/shared/enums/class-type.enum";
import type { ClassDTO } from "@/shared/types/class.types";
import { ClassActions } from "./class-actions";
import { ClassTypeBadge, useClassColumns } from "./class-columns";
import { ClassDetailsDialog } from "./class-details-dialog";
import { ClassFormDialog } from "./class-form-dialog";

export function ClassesTable() {
  const t = useTranslations("adminClasses");
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
  const [classTypeFilter, setClassTypeFilter] = useState(
    searchParams.get("classType") || "all",
  );
  const [teacherFilter, setTeacherFilter] = useState(
    searchParams.get("teacherId") || "all",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const limit = 10;

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClassForEdit, setSelectedClassForEdit] =
    useState<ClassDTO | null>(null);
  const [selectedClassForDetails, setSelectedClassForDetails] =
    useState<ClassDTO | null>(null);
  const [pendingDeleteClass, setPendingDeleteClass] = useState<ClassDTO | null>(
    null,
  );
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
    if (classTypeFilter && classTypeFilter !== "all")
      params.set("classType", classTypeFilter);
    if (teacherFilter && teacherFilter !== "all")
      params.set("teacherId", teacherFilter);
    if (page) params.set("page", String(page));
    params.set("limit", String(limit));
    router.replace(`?${params.toString()}`);
  }, [debouncedSearch, classTypeFilter, teacherFilter, page, limit, router]);

  // Fetch classes list
  const swrKey = useMemo(
    () => [
      "admin-classes",
      debouncedSearch,
      classTypeFilter,
      teacherFilter,
      page,
      limit,
    ],
    [debouncedSearch, classTypeFilter, teacherFilter, page, limit],
  );

  const {
    data: classesResponse,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(
    swrKey,
    () =>
      apiClient.classes.list({
        q: debouncedSearch || undefined,
        classType:
          classTypeFilter !== "all"
            ? (classTypeFilter as ClassType)
            : undefined,
        teacherId: teacherFilter !== "all" ? teacherFilter : undefined,
        page,
        limit,
      }),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  // Handlers
  const handleEdit = (classItem: ClassDTO) => {
    setSelectedClassForEdit(classItem);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedClassForEdit(null);
    setIsFormOpen(true);
  };

  const handleDeletePrompt = (classItem: ClassDTO) => {
    setPendingDeleteClass(classItem);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteClass) return;

    setIsDeleting(true);
    try {
      await apiClient.classes.delete(pendingDeleteClass.id);
      toast.success(t("toasts.deleted"));
      mutate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("toasts.loadFailed");
      toast.error(msg);
    } finally {
      setIsDeleting(false);
      setPendingDeleteClass(null);
    }
  };

  const handleViewDetails = (classItem: ClassDTO) => {
    setSelectedClassForDetails(classItem);
  };

  const columns = useClassColumns({
    dateLocale,
    onEdit: handleEdit,
    onDelete: handleDeletePrompt,
    onViewDetails: handleViewDetails,
  });

  const classes = classesResponse?.items ?? [];
  const total = classesResponse?.meta.total ?? 0;
  const totalPages = classesResponse?.meta.totalPages ?? 0;

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
            onClick={handleCreate}
            className="flex-1 sm:flex-none justify-center gap-1.5 px-4 py-2 text-sm font-medium cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t("controls.addClass")}</span>
          </Button>
        </div>
      </div>

      {/* Row 2: Class Type & Teacher Filters */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
        {/* Class Type Filter */}
        <div className="col-span-1 sm:w-44">
          <Select
            value={classTypeFilter}
            onValueChange={(val) => {
              setClassTypeFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("controls.allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("controls.allTypes")}</SelectItem>
              <SelectItem value={ClassType.GROUP}>
                {t("classTypes.group")}
              </SelectItem>
              <SelectItem value={ClassType.INDIVIDUAL}>
                {t("classTypes.individual")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Teacher Filter */}
        <div className="col-span-1 sm:w-52">
          <RelationSelect
            endpoint="/teachers/select"
            value={teacherFilter}
            onValueChange={(teacherId) => {
              setTeacherFilter(teacherId);
              setPage(1);
            }}
            placeholder={t("controls.allTeachers")}
            emptyOption={{
              value: "all",
              label: t("controls.allTeachers"),
            }}
          />
        </div>
      </div>
    </div>
  );

  // Mobile Adaptive Card View (< md)
  const renderMobileCard = (classItem: ClassDTO) => (
    <div
      key={classItem.id}
      className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs space-y-3 hover:border-border transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-sm">
              {classItem.name}
            </span>
          </div>
          <div className="pt-0.5">
            <ClassTypeBadge type={classItem.classType} />
          </div>
        </div>

        <ClassActions
          classItem={classItem}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* Teachers info */}
      <div className="space-y-1 pt-2 border-t border-border/60 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {t("columns.primaryTeacher")}:
          </span>
          <span className="font-medium text-foreground">
            {classItem.primaryTeacherName ? (
              classItem.primaryTeacherName
            ) : (
              <span className="text-muted-foreground/60 italic font-normal">
                {t("dialogs.unassigned")}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {t("columns.secondaryTeacher")}:
          </span>
          <span>
            {classItem.secondaryTeacherName ? (
              classItem.secondaryTeacherName
            ) : (
              <span className="text-muted-foreground/60 italic">
                {t("dialogs.unassigned")}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Date footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
        <span>{t("columns.createdAt")}</span>
        <span className="text-[11px] text-muted-foreground/80">
          {classItem.createdAt && isHydrated
            ? format(new Date(classItem.createdAt), "PP", {
                locale: dateLocale,
              })
            : "—"}
        </span>
      </div>
    </div>
  );

  if (error) return <div>{t("toasts.loadFailed")}</div>;

  return (
    <>
      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={classes}
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
          summary: t("summary", { count: classes.length, total }),
        }}
        emptyMessage={t("empty")}
        emptyIcon={
          <Users className="h-10 w-10 mx-auto text-muted-foreground/50" />
        }
      />

      {/* Modals & Dialogs */}
      <ClassFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedClassForEdit(null);
        }}
        onSuccess={() => mutate()}
        classItem={selectedClassForEdit}
      />

      <ClassDetailsDialog
        isOpen={Boolean(selectedClassForDetails)}
        onClose={() => setSelectedClassForDetails(null)}
        classItem={selectedClassForDetails}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteClass)}
        onClose={() => setPendingDeleteClass(null)}
        onConfirm={handleConfirmDelete}
        title={t("dialogs.deleteTitle", {
          name: pendingDeleteClass?.name ?? "",
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
