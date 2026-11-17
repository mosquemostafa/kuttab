"use client";

import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LatenessPeriod,
  type TeacherDailyAttendanceDTO,
} from "@/shared/types/teacher-attendance.types";
import { useState, useEffect } from "react";

interface AttendanceLatenessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: TeacherDailyAttendanceDTO | null;
  attendanceDate: string;
  onSave: (latenessPeriod: LatenessPeriod | null) => Promise<void>;
}

export function AttendanceLatenessDialog({
  open,
  onOpenChange,
  record,
  attendanceDate,
  onSave,
}: AttendanceLatenessDialogProps) {
  const t = useTranslations("adminTeacherAttendances");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record?.attendance) {
      setSelectedPeriod(record.attendance.latenessPeriod ?? "none");
    } else {
      setSelectedPeriod("none");
    }
  }, [record]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const value =
        selectedPeriod === "none"
          ? null
          : (selectedPeriod as LatenessPeriod);
      await onSave(value);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialog.editLatenessTitle")}</DialogTitle>
          <DialogDescription>
            {t("dialog.editLatenessDesc", {
              name: record?.teacherName ?? "",
              date: attendanceDate,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("dialog.latenessPeriodLabel")}
            </label>
            <Select
              value={selectedPeriod}
              onValueChange={setSelectedPeriod}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t("latenessPeriods.none")}
                </SelectItem>
                <SelectItem value={LatenessPeriod.FROM_35_TO_45_MIN}>
                  {t("latenessPeriods.from_35_to_45_min")}
                </SelectItem>
                <SelectItem value={LatenessPeriod.FROM_45_TO_60_MIN}>
                  {t("latenessPeriods.from_45_to_60_min")}
                </SelectItem>
                <SelectItem value={LatenessPeriod.MORE_THAN_60_MIN}>
                  {t("latenessPeriods.more_than_60_min")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("actions.save") : t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
