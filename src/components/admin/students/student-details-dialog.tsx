"use client";

import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Info,
  Phone,
  School,
  XCircle,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { StudentDTO } from "@/shared/types/student.types";
import {
  StudentPaymentMethodBadge,
  StudentStatusBadge,
} from "./student-columns";

interface StudentDetailsDialogProps {
  student: StudentDTO | null;
  classesMap: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (student: StudentDTO) => void;
}

export function StudentDetailsDialog({
  student,
  classesMap,
  isOpen,
  onClose,
  onEdit,
}: StudentDetailsDialogProps) {
  const t = useTranslations("adminStudents");
  const locale = useLocale();
  const dateLocale = locale.startsWith("ar") ? ar : enUS;

  if (!student) return null;

  const formatDateStr = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "PPP", { locale: dateLocale });
    } catch {
      return dateStr;
    }
  };

  const className = student.classId
    ? classesMap[student.classId] || student.classId
    : t("dialogs.noClass");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-bold truncate">
                {t("dialogs.detailsTitle", { name: student.name })}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {t("dialogs.detailsDescription")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-sm pt-2">
          {/* Status & Badges Strip */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border/50">
            <StudentStatusBadge status={student.status} />
            <StudentPaymentMethodBadge method={student.paymentMethod} />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <School className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span>{className}</span>
            </span>
          </div>

          {/* Section 1: Personal & Contact */}
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
                  {student.name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("dialogs.phoneLabel")}:{" "}
                </span>
                {student.phone ? (
                  <a
                    href={`tel:${student.phone}`}
                    className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                    dir="ltr"
                  >
                    <Phone className="h-3 w-3" />
                    <span>{student.phone}</span>
                  </a>
                ) : (
                  <span>—</span>
                )}
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("dialogs.gradeLabel")}:{" "}
                </span>
                <span className="font-medium text-foreground">
                  {student.grade || "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("dialogs.jobLabel")}:{" "}
                </span>
                <span className="font-medium text-foreground">
                  {student.job || "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("dialogs.birthDateLabel")}:{" "}
                </span>
                <span className="font-medium text-foreground">
                  {formatDateStr(student.birthDate)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("dialogs.registrationDateLabel")}:{" "}
                </span>
                <span className="font-medium text-foreground">
                  {formatDateStr(student.registrationDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Quran & Academic Record */}
          <div className="rounded-lg border p-3.5 space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{t("columns.memorization")}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">
                  {t("dialogs.memorizedPartsCountLabel")}:{" "}
                </span>
                <span className="font-mono font-bold text-foreground">
                  {student.memorizedPartsCount} / 30
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("columns.tajweed")}:{" "}
                </span>
                <span className="font-medium text-foreground inline-flex items-center gap-1">
                  {student.studiedTajweed ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <span>{t("tajweed.yes")}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{t("tajweed.no")}</span>
                    </>
                  )}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">
                  {t("dialogs.previouslyEnrolledLabel")}:{" "}
                </span>
                <span className="font-medium text-foreground">
                  {student.previouslyEnrolled
                    ? `${t("tajweed.yes")} (${student.previousEnrolledPlace || "—"})`
                    : t("tajweed.no")}
                </span>
              </div>
              {student.memorizationDetails && (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground block mb-0.5">
                    {t("dialogs.memorizationDetailsLabel")}:
                  </span>
                  <div className="p-2 rounded bg-muted/40 text-foreground font-mono text-[11px] whitespace-pre-wrap">
                    {student.memorizationDetails}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Administrative Notes */}
          {student.notes && (
            <div className="rounded-lg border p-3.5 space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("dialogs.notesLabel")}
              </div>
              <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                {student.notes}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 px-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {t("columns.createdAt")}: {formatDateStr(student.createdAt)}
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
                onEdit(student);
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
