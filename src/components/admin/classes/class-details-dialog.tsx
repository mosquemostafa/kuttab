"use client";

import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import { Calendar, School, User, Users } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ClassDTO } from "@/shared/types/class.types";
import { ClassTypeBadge } from "./class-columns";

interface ClassDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classItem?: ClassDTO | null;
}

export function ClassDetailsDialog({
  isOpen,
  onClose,
  classItem,
}: ClassDetailsDialogProps) {
  const t = useTranslations("adminClasses");
  const locale = useLocale();
  const dateLocale = locale.startsWith("ar") ? ar : enUS;

  if (!classItem) return null;

  const primaryTeacherName = classItem.primaryTeacherName;
  const secondaryTeacherName = classItem.secondaryTeacherName;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <School className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>
                {t("dialogs.detailsTitle", { name: classItem.name })}
              </DialogTitle>
              <DialogDescription>
                {t("dialogs.detailsDescription")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Main Info Card */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t("columns.name")}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {classItem.name}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t("columns.classType")}
              </span>
              <ClassTypeBadge type={classItem.classType} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t("columns.primaryTeacher")}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {primaryTeacherName || (
                    <span className="text-muted-foreground/60 italic font-normal">
                      {t("dialogs.unassigned")}
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t("columns.secondaryTeacher")}
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {secondaryTeacherName || (
                    <span className="text-muted-foreground/60 italic">
                      {t("dialogs.unassigned")}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="space-y-2 text-xs text-muted-foreground">
            {classItem.createdAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {t("columns.createdAt")}:{" "}
                  {format(new Date(classItem.createdAt), "PPP p", {
                    locale: dateLocale,
                  })}
                </span>
              </div>
            )}
            <div className="text-[11px] font-mono text-muted-foreground/60">
              ID: {classItem.id}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("dialogs.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
