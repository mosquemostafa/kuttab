"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { Locale } from "date-fns";
import { User, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ClassType } from "@/shared/enums/class-type.enum";
import type { ClassDTO } from "@/shared/types/class.types";
import { ClassActions } from "./class-actions";

export function ClassTypeBadge({ type }: { type: ClassType }) {
  const t = useTranslations("adminClasses");

  if (type === ClassType.GROUP) {
    return (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1 px-2 py-0.5 text-xs font-normal"
      >
        <Users className="h-3 w-3" />
        <span>{t("classTypes.group")}</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1 px-2 py-0.5 text-xs font-normal"
    >
      <User className="h-3 w-3" />
      <span>{t("classTypes.individual")}</span>
    </Badge>
  );
}

interface UseClassColumnsOptions {
  teachersMap?: Record<string, string>;
  dateLocale?: Locale;
  onEdit: (classItem: ClassDTO) => void;
  onDelete: (classItem: ClassDTO) => void;
  onViewDetails: (classItem: ClassDTO) => void;
}

export function useClassColumns({
  teachersMap = {},
  dateLocale,
  onEdit,
  onDelete,
  onViewDetails,
}: UseClassColumnsOptions): ColumnDef<ClassDTO>[] {
  const t = useTranslations("adminClasses");

  return useMemo<ColumnDef<ClassDTO>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("columns.name"),
        cell: ({ row }) => (
          <div className="flex flex-col min-w-[140px]">
            <span className="font-medium text-foreground text-sm">
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "classType",
        header: t("columns.classType"),
        cell: ({ row }) => <ClassTypeBadge type={row.original.classType} />,
      },
      {
        accessorKey: "primaryTeacherId",
        header: t("columns.primaryTeacher"),
        cell: ({ row }) => {
          const teacherId = row.original.primaryTeacherId;
          const teacherName = teacherId ? teachersMap[teacherId] : null;

          if (!teacherId || !teacherName) {
            return (
              <span className="text-xs text-muted-foreground/60 italic">
                {t("dialogs.unassigned")}
              </span>
            );
          }

          return (
            <span className="text-xs font-medium text-foreground">
              {teacherName}
            </span>
          );
        },
      },
      {
        accessorKey: "secondaryTeacherId",
        header: t("columns.secondaryTeacher"),
        cell: ({ row }) => {
          const teacherId = row.original.secondaryTeacherId;
          const teacherName = teacherId ? teachersMap[teacherId] : null;

          if (!teacherId || !teacherName) {
            return (
              <span className="text-xs text-muted-foreground/60 italic">
                {t("dialogs.unassigned")}
              </span>
            );
          }

          return (
            <span className="text-xs text-muted-foreground">{teacherName}</span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: t("columns.createdAt"),
        cell: ({ row }) => {
          const dateVal = row.original.createdAt;
          if (!dateVal)
            return <span className="text-xs text-muted-foreground">—</span>;

          try {
            return (
              <span className="text-xs text-muted-foreground">
                {format(new Date(dateVal), "dd MMM yyyy", {
                  locale: dateLocale,
                })}
              </span>
            );
          } catch {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("columns.actions")}</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ClassActions
              classItem={row.original}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
            />
          </div>
        ),
      },
    ],
    [t, teachersMap, dateLocale, onEdit, onDelete, onViewDetails],
  );
}
