"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Phone,
  UserCheck,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import type { Locale } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { TeacherStatus } from "@/shared/enums/teacher-status.enum";
import { TeacherStudentType } from "@/shared/enums/teacher-student-type.enum";
import type { TeacherDTO } from "@/shared/types/teacher.types";
import { TeacherActions } from "./teacher-actions";

export function TeacherStatusBadge({ status }: { status: TeacherStatus }) {
  const t = useTranslations("adminTeachers");

  if (status === TeacherStatus.ACTIVE) {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1 px-2 py-0.5 text-xs font-normal"
      >
        <CheckCircle2 className="h-3 w-3" />
        <span>{t("statuses.active")}</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="text-xs px-2 py-0.5 font-normal text-muted-foreground"
    >
      <span>{t("statuses.archived")}</span>
    </Badge>
  );
}

export function TeacherStudentTypeBadge({
  type,
}: {
  type: TeacherStudentType | null;
}) {
  const t = useTranslations("adminTeachers");

  if (!type) {
    return <span className="text-xs text-muted-foreground/60">—</span>;
  }

  const getStyle = () => {
    switch (type) {
      case TeacherStudentType.FOUNDATION:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
      case TeacherStudentType.KHATIMEEN:
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
      case TeacherStudentType.CHILDREN:
        return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800";
      case TeacherStudentType.ADULTS:
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800";
    }
  };

  const getIcon = () => {
    switch (type) {
      case TeacherStudentType.FOUNDATION:
        return <BookOpen className="h-3 w-3" />;
      case TeacherStudentType.KHATIMEEN:
        return <Award className="h-3 w-3" />;
      case TeacherStudentType.CHILDREN:
        return <Users className="h-3 w-3" />;
      case TeacherStudentType.ADULTS:
      default:
        return <GraduationCap className="h-3 w-3" />;
    }
  };

  const getLabel = () => {
    switch (type) {
      case TeacherStudentType.FOUNDATION:
        return t("studentTypes.foundation");
      case TeacherStudentType.KHATIMEEN:
        return t("studentTypes.khatimeen");
      case TeacherStudentType.CHILDREN:
        return t("studentTypes.children");
      case TeacherStudentType.ADULTS:
      default:
        return t("studentTypes.adults");
    }
  };

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 font-normal ${getStyle()}`}
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </Badge>
  );
}

interface UseTeacherColumnsOptions {
  dateLocale: Locale;
  onEdit: (teacher: TeacherDTO) => void;
  onDelete: (teacher: TeacherDTO) => void;
  onViewDetails: (teacher: TeacherDTO) => void;
}

export function useTeacherColumns({
  dateLocale,
  onEdit,
  onDelete,
  onViewDetails,
}: UseTeacherColumnsOptions): ColumnDef<TeacherDTO>[] {
  const t = useTranslations("adminTeachers");

  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: t("columns.name"),
        cell: ({ row }) => {
          const teacher = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserCheck className="h-4 w-4" />
              </div>
              <button
                type="button"
                onClick={() => onViewDetails(teacher)}
                className="text-start font-medium text-sm text-foreground hover:underline cursor-pointer truncate"
              >
                {teacher.name}
              </button>
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
        accessorKey: "studentType",
        header: t("columns.studentType"),
        cell: ({ row }) => (
          <TeacherStudentTypeBadge type={row.original.studentType} />
        ),
      },
      {
        accessorKey: "sallary",
        header: t("columns.sallary"),
        cell: ({ row }) => {
          const sallary = row.original.sallary;
          if (sallary === null || sallary === undefined) {
            return <span className="text-xs text-muted-foreground/60">—</span>;
          }
          return (
            <span className="text-xs font-medium text-foreground">
              {sallary.toLocaleString()}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("columns.status"),
        cell: ({ row }) => <TeacherStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: t("columns.createdAt"),
        cell: ({ row }) => {
          const date = row.original.createdAt;
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
          <TeacherActions
            teacher={row.original}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewDetails={onViewDetails}
          />
        ),
      },
    ],
    [t, dateLocale, onEdit, onDelete, onViewDetails],
  );
}
