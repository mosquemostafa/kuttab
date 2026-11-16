"use client";

import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import { Calendar, FileText, Info, Phone, UserCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TeacherDTO } from "@/shared/types/teacher.types";
import { TeacherStatusBadge, TeacherStudentTypeBadge } from "./teacher-columns";

interface TeacherDetailsDialogProps {
  teacher: TeacherDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (teacher: TeacherDTO) => void;
}

export function TeacherDetailsDialog({
  teacher,
  isOpen,
  onClose,
  onEdit,
}: TeacherDetailsDialogProps) {
  const t = useTranslations("adminTeachers");
  const locale = useLocale();
  const dateLocale = locale.startsWith("ar") ? ar : enUS;

  if (!teacher) return null;

  const formatDateStr = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "PPP", { locale: dateLocale });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-bold truncate">
                {t("dialogs.detailsTitle", { name: teacher.name })}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {t("dialogs.detailsDescription")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-sm pt-2">
          {/* Status & Teaching Track Strip */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border/50">
            <TeacherStatusBadge status={teacher.status} />
            <TeacherStudentTypeBadge type={teacher.studentType} />
          </div>

          {/* Section 1: Contact & Personal Info */}
          <div className="rounded-lg border p-3.5 space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              <span>{t("columns.name")}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">
                  {t("dialogs.nameLabel")}:{" "}
                </span>
                <span className="font-medium text-foreground">
                  {teacher.name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("dialogs.phoneLabel")}:{" "}
                </span>
                {teacher.phone ? (
                  <a
                    href={`tel:${teacher.phone}`}
                    className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                    dir="ltr"
                  >
                    <Phone className="h-3 w-3" />
                    <span>{teacher.phone}</span>
                  </a>
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Administrative & Qualifications Notes */}
          {teacher.notes && (
            <div className="rounded-lg border p-3.5 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span>{t("dialogs.notesLabel")}</span>
              </div>
              <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                {teacher.notes}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 px-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {t("columns.createdAt")}: {formatDateStr(teacher.createdAt)}
              </span>
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="cursor-pointer"
          >
            {t("dialogs.close")}
          </Button>
          {onEdit && (
            <Button
              size="sm"
              onClick={() => {
                onClose();
                onEdit(teacher);
              }}
              className="cursor-pointer"
            >
              {t("actions.edit")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
