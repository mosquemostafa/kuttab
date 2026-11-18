"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import type { Locale } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, GraduationCap, WalletCards } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { StudentSubscriptionType } from "@/shared/enums/student-subscription-type.enum";
import type { StudentSubscriptionDTO } from "@/shared/types/student-subscription.types";
import { StudentSubscriptionActions } from "./student-subscription-actions";
import { useSubscriptionTypeLabel } from "./use-subscription-type-label";

const TYPE_VARIANTS: Record<
  StudentSubscriptionType,
  "default" | "secondary" | "outline"
> = {
  [StudentSubscriptionType.MONTHLY]: "default",
  [StudentSubscriptionType.YEARLY]: "default",
  [StudentSubscriptionType.INSTALLMENTS]: "secondary",
};

export function StudentSubscriptionTypeBadge({
  type,
}: {
  type: StudentSubscriptionType;
}) {
  const getTypeLabel = useSubscriptionTypeLabel();

  return <Badge variant={TYPE_VARIANTS[type]}>{getTypeLabel(type)}</Badge>;
}

interface UseStudentSubscriptionColumnsOptions {
  locale: string;
  dateLocale: Locale;
  onEdit: (subscription: StudentSubscriptionDTO) => void;
  onDelete: (subscription: StudentSubscriptionDTO) => void;
  onViewDetails: (subscription: StudentSubscriptionDTO) => void;
}

export function useStudentSubscriptionColumns({
  locale,
  dateLocale,
  onEdit,
  onDelete,
  onViewDetails,
}: UseStudentSubscriptionColumnsOptions): ColumnDef<StudentSubscriptionDTO>[] {
  const t = useTranslations("adminStudentSubscriptions");
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );

  return useMemo(
    () => [
      {
        accessorKey: "studentId",
        header: t("columns.student"),
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <GraduationCap />
            </div>
            <button
              type="button"
              className="truncate text-start text-sm font-medium hover:underline"
              onClick={() => onViewDetails(row.original)}
            >
              {row.original.studentName}
            </button>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: t("columns.amount"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 tabular-nums">
            <WalletCards className="text-muted-foreground" />
            <span className="font-medium">
              {numberFormatter.format(row.original.amount)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: t("columns.type"),
        cell: ({ row }) => (
          <StudentSubscriptionTypeBadge type={row.original.type} />
        ),
      },
      {
        accessorKey: "date",
        header: t("columns.date"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
            <CalendarDays />
            <time dateTime={row.original.date}>
              {format(parseISO(row.original.date), "PP", {
                locale: dateLocale,
              })}
            </time>
          </div>
        ),
      },
      {
        id: "actions",
        header: t("columns.actions"),
        cell: ({ row }) => (
          <div className="flex justify-end">
            <StudentSubscriptionActions
              subscription={row.original}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
            />
          </div>
        ),
      },
    ],
    [
      dateLocale,
      numberFormatter,
      onDelete,
      onEdit,
      onViewDetails,
      t,
    ],
  );
}
