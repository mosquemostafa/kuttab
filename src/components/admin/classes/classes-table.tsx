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

  // Fetch teachers for dropdown & map
  const { data: teachersData } = useSWR(
    ["teachers-select-options"],
    () => apiClient.teachers.select({ limit: 100 }),
    { revalidateOnFocus: false },
  );

  const teachers = teachersData?.items ?? [];

  const teachersMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const tc of teachers) {
      map[tc.id] = tc.name;
    }
    return map;
  }, [teachers]);

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
    teachersMap,
    dateLocale,
    onEdit: handleEdit,
    onDelete: handleDeletePrompt,
    onViewDetails: handleViewDetails,
  });

  const classes = classesResponse?.items ?? [];
  const meta = classesResponse?.meta;
  const totalPages = meta?.totalPages ?? 1;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-destructive">{error.message}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutate()}
          className="mt-4"
        >
          {t("controls.refresh")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={t("controls.search")}
              className="h-9 w-full rounded-md border border-input bg-background px-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rtl:left-3 rtl:right-auto"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Class Type Filter */}
          <Select
            value={classTypeFilter}
            onValueChange={(val) => {
              setClassTypeFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[160px] text-xs">
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

          {/* Teacher Filter */}
          <Select
            value={teacherFilter}
            onValueChange={(val) => {
              setTeacherFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[170px] text-xs">
              <SelectValue placeholder={t("controls.allTeachers")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("controls.allTeachers")}</SelectItem>
              {teachers.map((tc) => (
                <SelectItem key={tc.id} value={tc.id}>
                  {tc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Refresh Button */}
          <DataTableRefreshButton
            onRefresh={() => mutate()}
            isRefreshing={isValidating}
            aria-label={t("controls.refresh")}
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCreate}
            size="sm"
            className="h-9 gap-1.5 cursor-pointer shadow-sm text-xs font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>{t("controls.addClass")}</span>
          </Button>
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={classes}
        isLoading={isLoading}
        emptyMessage={t("empty")}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        renderMobileCard={(classItem) => (
          <div className="rounded-lg border bg-card p-4 space-y-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
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
            <div className="space-y-1 pt-2 border-t text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {t("columns.primaryTeacher")}:
                </span>
                <span className="font-medium text-foreground">
                  {classItem.primaryTeacherId &&
                  teachersMap[classItem.primaryTeacherId] ? (
                    teachersMap[classItem.primaryTeacherId]
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
                  {classItem.secondaryTeacherId &&
                  teachersMap[classItem.secondaryTeacherId] ? (
                    teachersMap[classItem.secondaryTeacherId]
                  ) : (
                    <span className="text-muted-foreground/60 italic">
                      {t("dialogs.unassigned")}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Date footer */}
            <div className="flex items-center justify-between pt-1 border-t text-[11px] text-muted-foreground">
              <span>{t("columns.createdAt")}:</span>
              <span>
                {classItem.createdAt && isHydrated
                  ? format(new Date(classItem.createdAt), "dd MMM yyyy", {
                      locale: dateLocale,
                    })
                  : "—"}
              </span>
            </div>
          </div>
        )}
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
        teachersMap={teachersMap}
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
    </div>
  );
}
