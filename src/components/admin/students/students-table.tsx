"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import {
  BookOpen,
  GraduationCap,
  Phone,
  Plus,
  School,
  Search,
  Users,
  XCircle,
} from "lucide-react";

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
import { StudentStatus } from "@/shared/enums/student-status.enum";
import { StudentPaymentMethod } from "@/shared/enums/student-payment-method.enum";
import type { StudentDTO } from "@/shared/types/student.types";
import { StudentActions } from "./student-actions";
import {
  StudentPaymentMethodBadge,
  StudentStatusBadge,
  useStudentColumns,
} from "./student-columns";
import { StudentDetailsDialog } from "./student-details-dialog";
import { StudentFormDialog } from "./student-form-dialog";

export function StudentsTable() {
  const t = useTranslations("adminStudents");
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
  const [classFilter, setClassFilter] = useState(
    searchParams.get("classId") || "all",
  );
  const [paymentFilter, setPaymentFilter] = useState(
    searchParams.get("paymentMethod") || "all",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const limit = 10;

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] =
    useState<StudentDTO | null>(null);
  const [selectedStudentForDetails, setSelectedStudentForDetails] =
    useState<StudentDTO | null>(null);
  const [pendingDeleteStudent, setPendingDeleteStudent] =
    useState<StudentDTO | null>(null);
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
    if (classFilter && classFilter !== "all")
      params.set("classId", classFilter);
    if (paymentFilter && paymentFilter !== "all")
      params.set("paymentMethod", paymentFilter);
    if (page) params.set("page", String(page));
    params.set("limit", String(limit));
    router.replace(`?${params.toString()}`);
  }, [
    debouncedSearch,
    statusFilter,
    classFilter,
    paymentFilter,
    page,
    limit,
    router,
  ]);

  // Fetch students list
  const swrKey = useMemo(
    () =>
      [
        "admin-students",
        debouncedSearch,
        statusFilter,
        classFilter,
        paymentFilter,
        page,
        limit,
      ] as const,
    [debouncedSearch, statusFilter, classFilter, paymentFilter, page, limit],
  );

  const { data, error, mutate, isLoading, isValidating } = useSWR(
    swrKey,
    ([, qVal, statusVal, classVal, payVal, pageVal, limitVal]) =>
      apiClient.students.list({
        q: qVal || undefined,
        status: statusVal !== "all" ? (statusVal as StudentStatus) : undefined,
        classId: classVal !== "all" ? classVal : undefined,
        paymentMethod:
          payVal !== "all" ? (payVal as StudentPaymentMethod) : undefined,
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

  const students = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 0;

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!pendingDeleteStudent) return;
    try {
      setIsDeleting(true);
      await apiClient.students.delete(pendingDeleteStudent.id);
      toast.success(t("toasts.deleted"));
      mutate();
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setIsDeleting(false);
      setPendingDeleteStudent(null);
    }
  };

  const columns = useStudentColumns({
    dateLocale,
    onEdit: (student) => {
      setSelectedStudentForEdit(student);
      setIsFormOpen(true);
    },
    onDelete: (student) => setPendingDeleteStudent(student),
    onViewDetails: (student) => setSelectedStudentForDetails(student),
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
              setSelectedStudentForEdit(null);
              setIsFormOpen(true);
            }}
            className="flex-1 sm:flex-none justify-center gap-1.5 px-4 py-2 text-sm font-medium cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t("controls.addStudent")}</span>
          </Button>
        </div>
      </div>

      {/* Row 2: Status, Class, Payment Method Filters */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
        {/* Status Select */}
        <div className="col-span-1 sm:w-40">
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
              <SelectItem value={StudentStatus.ACTIVE}>
                {t("statuses.active")}
              </SelectItem>
              <SelectItem value={StudentStatus.PENDING}>
                {t("statuses.pending")}
              </SelectItem>
              <SelectItem value={StudentStatus.ARCHIVED}>
                {t("statuses.archived")}
              </SelectItem>
              <SelectItem value={StudentStatus.REJECTED}>
                {t("statuses.rejected")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Class Select */}
        <div className="col-span-1 sm:w-44">
          <RelationSelect
            endpoint="/classes/select"
            value={classFilter}
            onValueChange={(classId) => {
              setClassFilter(classId);
              setPage(1);
            }}
            placeholder={t("controls.allClasses")}
            emptyOption={{
              value: "all",
              label: t("controls.allClasses"),
            }}
          />
        </div>

        {/* Payment Method Select */}
        <div className="col-span-2 sm:col-auto sm:w-44">
          <Select
            value={paymentFilter}
            onValueChange={(val) => {
              setPaymentFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("controls.allPaymentMethods")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("controls.allPaymentMethods")}
              </SelectItem>
              <SelectItem value={StudentPaymentMethod.MONTHLY}>
                {t("paymentMethods.monthly")}
              </SelectItem>
              <SelectItem value={StudentPaymentMethod.YEARLY}>
                {t("paymentMethods.yearly")}
              </SelectItem>
              <SelectItem value={StudentPaymentMethod.INSTALLMENTS}>
                {t("paymentMethods.installments")}
              </SelectItem>
              <SelectItem value={StudentPaymentMethod.EXEMPT_POOR}>
                {t("paymentMethods.exempt_poor")}
              </SelectItem>
              <SelectItem value={StudentPaymentMethod.EXEMPT_STAFF_KIDS}>
                {t("paymentMethods.exempt_staff_kids")}
              </SelectItem>
              <SelectItem value={StudentPaymentMethod.SPECIAL}>
                {t("paymentMethods.special")}
              </SelectItem>
              <SelectItem value={StudentPaymentMethod.SPONSORED}>
                {t("paymentMethods.sponsored")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  // Mobile Adaptive Card View (< md)
  const renderMobileCard = (student: StudentDTO) => {
    const subInfo = [student.grade, student.job].filter(Boolean).join(" • ");
    const className = student.className ?? t("dialogs.noClass");

    return (
      <div
        key={student.id}
        className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs space-y-3 hover:border-border transition-colors"
      >
        {/* Header: Avatar, Name, Grade/Job + StudentActions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex flex-col">
              <button
                type="button"
                onClick={() => setSelectedStudentForDetails(student)}
                className="text-start font-semibold text-sm text-foreground hover:underline cursor-pointer truncate"
              >
                {student.name}
              </button>
              {subInfo ? (
                <span className="text-xs text-muted-foreground truncate">
                  {subInfo}
                </span>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 -me-1 -mt-0.5">
            <StudentActions
              student={student}
              onEdit={(s) => {
                setSelectedStudentForEdit(s);
                setIsFormOpen(true);
              }}
              onDelete={(s) => setPendingDeleteStudent(s)}
              onViewDetails={(s) => setSelectedStudentForDetails(s)}
            />
          </div>
        </div>

        {/* Dedicated Phone Row */}
        {student.phone ? (
          <div
            className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md w-fit font-mono"
            dir="ltr"
          >
            <Phone className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
            <a
              href={`tel:${student.phone}`}
              className="hover:underline hover:text-foreground"
            >
              {student.phone}
            </a>
          </div>
        ) : null}

        {/* Badges Strip */}
        <div className="flex flex-wrap items-center gap-1.5">
          <StudentStatusBadge status={student.status} />
          <StudentPaymentMethodBadge method={student.paymentMethod} />
          <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded">
            <School className="h-3 w-3" />
            <span>{className}</span>
          </span>
        </div>

        {/* Card Footer: Memorization & Registration Date */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            <BookOpen className="h-3.5 w-3.5 text-primary/70 shrink-0" />
            <span className="font-mono">{student.memorizedPartsCount}</span>
            <span>/ 30</span>
          </div>

          <span className="text-[11px] text-muted-foreground/80">
            {student.registrationDate
              ? format(new Date(student.registrationDate), "PP", {
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
        data={students}
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
          summary: t("summary", { count: students.length, total }),
        }}
        emptyMessage={t("empty")}
        emptyIcon={
          <Users className="h-10 w-10 mx-auto text-muted-foreground/50" />
        }
      />

      {/* Create / Edit Dialog */}
      <StudentFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedStudentForEdit(null);
        }}
        onSuccess={() => mutate()}
        student={selectedStudentForEdit}
      />

      {/* Details Profile Dialog */}
      <StudentDetailsDialog
        isOpen={Boolean(selectedStudentForDetails)}
        onClose={() => setSelectedStudentForDetails(null)}
        student={selectedStudentForDetails}
        onEdit={(student) => {
          setSelectedStudentForDetails(null);
          setSelectedStudentForEdit(student);
          setIsFormOpen(true);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteStudent)}
        onClose={() => setPendingDeleteStudent(null)}
        onConfirm={handleDeleteConfirm}
        title={t("dialogs.deleteTitle", {
          name: pendingDeleteStudent?.name ?? "",
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
