"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Phone,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import type { Locale } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { StudentStatus } from "@/shared/enums/student-status.enum";
import { StudentPaymentMethod } from "@/shared/enums/student-payment-method.enum";
import type { StudentDTO } from "@/shared/types/student.types";
import { StudentActions } from "./student-actions";

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  const t = useTranslations("adminStudents");

  switch (status) {
    case StudentStatus.ACTIVE:
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1 px-2 py-0.5 text-xs font-normal"
        >
          <CheckCircle2 className="h-3 w-3" />
          <span>{t("statuses.active")}</span>
        </Badge>
      );
    case StudentStatus.PENDING:
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1 px-2 py-0.5 text-xs font-normal"
        >
          <Clock className="h-3 w-3" />
          <span>{t("statuses.pending")}</span>
        </Badge>
      );
    case StudentStatus.REJECTED:
      return (
        <Badge
          variant="destructive"
          className="flex items-center gap-1 px-2 py-0.5 text-xs font-normal"
        >
          <XCircle className="h-3 w-3" />
          <span>{t("statuses.rejected")}</span>
        </Badge>
      );
    case StudentStatus.ARCHIVED:
    default:
      return (
        <Badge
          variant="secondary"
          className="text-xs px-2 py-0.5 font-normal text-muted-foreground"
        >
          <span>{t("statuses.archived")}</span>
        </Badge>
      );
  }
}

export function StudentPaymentMethodBadge({
  method,
}: {
  method: StudentPaymentMethod | null;
}) {
  const t = useTranslations("adminStudents");

  if (!method) {
    return <span className="text-xs text-muted-foreground/60">—</span>;
  }

  const getStyle = () => {
    switch (method) {
      case StudentPaymentMethod.MONTHLY:
        return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800";
      case StudentPaymentMethod.INSTALLMENTS:
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800";
      case StudentPaymentMethod.EXEMPT_POOR:
      case StudentPaymentMethod.EXEMPT_STAFF_KIDS:
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
      case StudentPaymentMethod.SPONSORED:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
      case StudentPaymentMethod.SPECIAL:
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
    }
  };

  const getLabel = () => {
    switch (method) {
      case StudentPaymentMethod.MONTHLY:
        return t("paymentMethods.monthly");
      case StudentPaymentMethod.INSTALLMENTS:
        return t("paymentMethods.installments");
      case StudentPaymentMethod.EXEMPT_POOR:
        return t("paymentMethods.exempt_poor");
      case StudentPaymentMethod.EXEMPT_STAFF_KIDS:
        return t("paymentMethods.exempt_staff_kids");
      case StudentPaymentMethod.SPECIAL:
        return t("paymentMethods.special");
      case StudentPaymentMethod.SPONSORED:
        return t("paymentMethods.sponsored");
      default:
        return method;
    }
  };

  return (
    <Badge
      variant="outline"
      className={`text-xs px-2 py-0.5 font-normal ${getStyle()}`}
    >
      {getLabel()}
    </Badge>
  );
}

interface UseStudentColumnsOptions {
  dateLocale: Locale;
  classesMap: Record<string, string>;
  onEdit: (student: StudentDTO) => void;
  onDelete: (student: StudentDTO) => void;
  onViewDetails: (student: StudentDTO) => void;
}

export function useStudentColumns({
  dateLocale,
  classesMap,
  onEdit,
  onDelete,
  onViewDetails,
}: UseStudentColumnsOptions): ColumnDef<StudentDTO>[] {
  const t = useTranslations("adminStudents");

  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: t("columns.name"),
        cell: ({ row }) => {
          const student = row.original;
          const subInfo = [student.grade, student.job]
            .filter(Boolean)
            .join(" • ");

          return (
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <button
                  type="button"
                  onClick={() => onViewDetails(student)}
                  className="text-start font-medium text-sm text-foreground hover:underline cursor-pointer truncate"
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
          );
        },
      },
      {
        accessorKey: "phone",
        header: t("columns.phone"),
        cell: ({ row }) => {
          const phone = row.original.phone;
          if (!phone) {
            return <span className="text-xs text-muted-foreground/60">—</span>;
          }
          return (
            <a
              href={`tel:${phone}`}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors font-mono"
              dir="ltr"
            >
              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
              <span>{phone}</span>
            </a>
          );
        },
      },
      {
        id: "class",
        header: t("columns.class"),
        cell: ({ row }) => {
          const classId = row.original.classId;
          if (!classId) {
            return (
              <Badge variant="secondary" className="text-xs font-normal">
                {t("dialogs.noClass")}
              </Badge>
            );
          }
          const className = classesMap[classId] || classId;
          return (
            <Badge
              variant="outline"
              className="text-xs font-normal bg-muted/50"
            >
              {className}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("columns.status"),
        cell: ({ row }) => <StudentStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "paymentMethod",
        header: t("columns.paymentMethod"),
        cell: ({ row }) => (
          <StudentPaymentMethodBadge method={row.original.paymentMethod} />
        ),
      },
      {
        id: "memorization",
        header: t("columns.memorization"),
        cell: ({ row }) => {
          const parts = row.original.memorizedPartsCount;
          return (
            <div className="flex items-center gap-1.5 text-xs">
              <BookOpen className="h-3.5 w-3.5 text-primary/70 shrink-0" />
              <span className="font-medium font-mono">{parts}</span>
              <span className="text-muted-foreground text-[11px]">/ 30</span>
            </div>
          );
        },
      },
      {
        accessorKey: "registrationDate",
        header: t("columns.registrationDate"),
        cell: ({ row }) => {
          const date = row.original.registrationDate;
          if (!date)
            return <span className="text-xs text-muted-foreground/60">—</span>;
          try {
            return (
              <span className="text-xs text-muted-foreground">
                {format(new Date(date), "PP", { locale: dateLocale })}
              </span>
            );
          } catch {
            return (
              <span className="text-xs text-muted-foreground">{date}</span>
            );
          }
        },
      },
      {
        id: "actions",
        header: t("columns.actions"),
        size: 70,
        cell: ({ row }) => (
          <StudentActions
            student={row.original}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewDetails={onViewDetails}
          />
        ),
      },
    ],
    [t, dateLocale, classesMap, onEdit, onDelete, onViewDetails],
  );
}
