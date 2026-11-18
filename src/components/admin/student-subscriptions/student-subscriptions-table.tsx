"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import { CalendarDays, GraduationCap, Plus, ReceiptText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import useSWR from "swr";

import {
  StudentSubscriptionTypeBadge,
  useStudentSubscriptionColumns,
} from "@/components/admin/student-subscriptions/student-subscription-columns";
import { StudentSubscriptionActions } from "@/components/admin/student-subscriptions/student-subscription-actions";
import { StudentSubscriptionDetailsDialog } from "@/components/admin/student-subscriptions/student-subscription-details-dialog";
import { StudentSubscriptionFormDialog } from "@/components/admin/student-subscriptions/student-subscription-form-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DataTable, DataTableRefreshButton } from "@/components/ui/data-table";
import { Field, FieldLabel } from "@/components/ui/field";
import { RelationSelect } from "@/components/ui/relation-select";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api/api-client";
import { StudentSubscriptionType } from "@/shared/enums/student-subscription-type.enum";
import type { StudentSubscriptionDTO } from "@/shared/types/student-subscription.types";
import { useSubscriptionTypeLabel } from "./use-subscription-type-label";
import { SubscriptionDatePicker } from "./subscription-date-picker";

const SUBSCRIPTION_TYPES = Object.values(StudentSubscriptionType);
const PAGE_SIZE = 10;

export function StudentSubscriptionsTable() {
  const t = useTranslations("adminStudentSubscriptions");
  const getTypeLabel = useSubscriptionTypeLabel();
  const locale = useLocale();
  const dateLocale = locale.startsWith("ar") ? ar : enUS;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isHydrated, setIsHydrated] = useState(false);
  const [studentFilter, setStudentFilter] = useState(
    searchParams.get("studentId") ?? "all",
  );
  const [typeFilter, setTypeFilter] = useState(
    searchParams.get("type") ?? "all",
  );
  const [startDate, setStartDate] = useState(
    searchParams.get("startDate") ?? "",
  );
  const [endDate, setEndDate] = useState(searchParams.get("endDate") ?? "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] =
    useState<StudentSubscriptionDTO | null>(null);
  const [selectedForDetails, setSelectedForDetails] =
    useState<StudentSubscriptionDTO | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<StudentSubscriptionDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => setIsHydrated(true), []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (studentFilter !== "all") params.set("studentId", studentFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    router.replace(`?${params.toString()}`);
  }, [endDate, page, router, startDate, studentFilter, typeFilter]);

  const swrKey = useMemo(
    () => [
      "admin-student-subscriptions",
      studentFilter,
      typeFilter,
      startDate,
      endDate,
      page,
      PAGE_SIZE,
    ],
    [endDate, page, startDate, studentFilter, typeFilter],
  );

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    swrKey,
    () =>
      apiClient.studentSubscriptions.list({
        studentId: studentFilter !== "all" ? studentFilter : undefined,
        type:
          typeFilter !== "all"
            ? (typeFilter as StudentSubscriptionType)
            : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: PAGE_SIZE,
        sortBy: "date",
        sortOrder: "desc",
      }),
    { keepPreviousData: true, revalidateOnFocus: false },
  );

  const subscriptions = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 0;

  const openCreate = () => {
    setSelectedForEdit(null);
    setIsFormOpen(true);
  };

  const openEdit = (subscription: StudentSubscriptionDTO) => {
    setSelectedForEdit(subscription);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      setIsDeleting(true);
      await apiClient.studentSubscriptions.delete(pendingDelete.id);
      toast.success(t("toasts.deleted"));
      await mutate();
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : t("toasts.deleteFailed"),
      );
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  const columns = useStudentSubscriptionColumns({
    locale,
    dateLocale,
    onEdit: openEdit,
    onDelete: setPendingDelete,
    onViewDetails: setSelectedForDetails,
  });

  const filterControls = (
    <div className="mb-4 flex w-full flex-col gap-3">
      <div className="flex flex-col items-stretch justify-between gap-2.5 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <RelationSelect
            endpoint="/students/select"
            value={studentFilter}
            onValueChange={(value) => {
              setStudentFilter(value);
              setPage(1);
            }}
            placeholder={t("controls.allStudents")}
            emptyOption={{
              value: "all",
              label: t("controls.allStudents"),
            }}
            className="sm:w-56"
          />

          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t("controls.allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">{t("controls.allTypes")}</SelectItem>
                {SUBSCRIPTION_TYPES.map((subscriptionType) => (
                  <SelectItem
                    key={subscriptionType}
                    value={subscriptionType}
                  >
                    {getTypeLabel(subscriptionType)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <DataTableRefreshButton
            onRefresh={() => mutate()}
            isRefreshing={isValidating}
            label={t("controls.refresh")}
            className="flex-1 sm:flex-none"
          />
          <Button onClick={openCreate} className="flex-1 sm:flex-none">
            <Plus data-icon="inline-start" />
            {t("controls.addSubscription")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:max-w-xl">
        <Field className="gap-1.5">
          <FieldLabel>{t("controls.startDate")}</FieldLabel>
          <SubscriptionDatePicker
            value={startDate}
            max={endDate || undefined}
            onChange={(date) => {
              setStartDate(date);
              setPage(1);
            }}
            placeholder={t("controls.selectStartDate")}
            ariaLabel={t("controls.startDate")}
            locale={dateLocale}
            allowClear
            clearLabel={t("controls.clearDate")}
          />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel>{t("controls.endDate")}</FieldLabel>
          <SubscriptionDatePicker
            value={endDate}
            min={startDate || undefined}
            onChange={(date) => {
              setEndDate(date);
              setPage(1);
            }}
            placeholder={t("controls.selectEndDate")}
            ariaLabel={t("controls.endDate")}
            locale={dateLocale}
            allowClear
            clearLabel={t("controls.clearDate")}
          />
        </Field>
      </div>
    </div>
  );

  const renderMobileCard = (subscription: StudentSubscriptionDTO) => (
    <article
      key={subscription.id}
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap />
          </div>
          <div className="min-w-0">
            <button
              type="button"
              className="block max-w-full truncate text-start text-sm font-semibold hover:underline"
              onClick={() => setSelectedForDetails(subscription)}
            >
              {subscription.studentName}
            </button>
            <p className="mt-0.5 text-lg font-semibold tabular-nums">
              {new Intl.NumberFormat(locale).format(subscription.amount)}
            </p>
          </div>
        </div>
        <StudentSubscriptionActions
          subscription={subscription}
          onEdit={openEdit}
          onDelete={setPendingDelete}
          onViewDetails={setSelectedForDetails}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StudentSubscriptionTypeBadge type={subscription.type} />
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays />
          <time dateTime={subscription.date}>
            {format(parseISO(subscription.date), "PP", {
              locale: dateLocale,
            })}
          </time>
        </span>
      </div>
    </article>
  );

  if (error) {
    return (
      <p role="alert" className="py-8 text-center text-sm text-destructive">
        {t("toasts.loadFailed")}
      </p>
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={subscriptions}
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
          summary: t("summary", { count: subscriptions.length, total }),
        }}
        emptyMessage={t("empty")}
        emptyIcon={
          <ReceiptText className="mx-auto size-10 text-muted-foreground/50" />
        }
      />

      <StudentSubscriptionFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedForEdit(null);
        }}
        onSuccess={() => mutate()}
        subscription={selectedForEdit}
      />

      <StudentSubscriptionDetailsDialog
        isOpen={Boolean(selectedForDetails)}
        onClose={() => setSelectedForDetails(null)}
        onEdit={(subscription) => {
          setSelectedForDetails(null);
          openEdit(subscription);
        }}
        subscription={selectedForDetails}
        studentName={
          selectedForDetails?.studentName ?? ""
        }
        locale={locale}
        dateLocale={dateLocale}
      />

      <ConfirmationDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title={t("dialogs.deleteTitle")}
        description={t("dialogs.deleteDescription", {
          student: pendingDelete?.studentName ?? "",
        })}
        confirmText={
          isDeleting ? t("dialogs.deleting") : t("dialogs.deleteConfirm")
        }
        cancelText={t("dialogs.cancel")}
        confirmVariant="destructive"
      />
    </>
  );
}
