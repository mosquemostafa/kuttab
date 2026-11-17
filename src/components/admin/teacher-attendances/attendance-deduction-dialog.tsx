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
  AttendanceDeductionType,
  type TeacherDailyAttendanceDTO,
} from "@/shared/types/teacher-attendance.types";
import { useState, useEffect } from "react";

interface AttendanceDeductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: TeacherDailyAttendanceDTO | null;
  attendanceDate: string;
  onSave: (attendanceDeductionType: AttendanceDeductionType | null) => Promise<void>;
}

export function AttendanceDeductionDialog({
  open,
  onOpenChange,
  record,
  attendanceDate,
  onSave,
}: AttendanceDeductionDialogProps) {
  const t = useTranslations("adminTeacherAttendances");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record?.attendance) {
      setSelectedPeriod(record.attendance.attendanceDeductionType ?? "none");
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
          : (selectedPeriod as AttendanceDeductionType);
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
          <DialogTitle>{t("dialog.editDeductionTitle")}</DialogTitle>
          <DialogDescription>
            {t("dialog.editDeductionDesc", {
              name: record?.teacherName ?? "",
              date: attendanceDate,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("dialog.attendanceDeductionTypeLabel")}
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
                  {t("attendanceDeductionTypes.none")}
                </SelectItem>
                <SelectItem value={AttendanceDeductionType.FROM_35_TO_45_MIN}>
                  {t("attendanceDeductionTypes.from_35_to_45_min")}
                </SelectItem>
                <SelectItem value={AttendanceDeductionType.FROM_45_TO_60_MIN}>
                  {t("attendanceDeductionTypes.from_45_to_60_min")}
                </SelectItem>
                <SelectItem value={AttendanceDeductionType.MORE_THAN_60_MIN}>
                  {t("attendanceDeductionTypes.more_than_60_min")}
                </SelectItem>
                <SelectItem value={AttendanceDeductionType.EXCUSED_ABSENCE}>
                  {t("attendanceDeductionTypes.excused_absence")}
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
