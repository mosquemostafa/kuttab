"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api/api-client";
import { TeacherStatus } from "@/shared/enums/teacher-status.enum";
import { TeacherStudentType } from "@/shared/enums/teacher-student-type.enum";
import type { TeacherDTO } from "@/shared/types/teacher.types";
import type {
  CreateTeacherDTO,
  UpdateTeacherDTO,
} from "@/server/modules/teachers/teacher.dto";

interface TeacherFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teacher?: TeacherDTO | null;
}

export function TeacherFormDialog({
  isOpen,
  onClose,
  onSuccess,
  teacher,
}: TeacherFormDialogProps) {
  const t = useTranslations("adminTeachers");
  const isEditing = Boolean(teacher);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    studentType: "none",
    status: TeacherStatus.ACTIVE as TeacherStatus,
    sallary: "",
    notes: "",
  });

  // Populate on edit or reset on create
  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name || "",
        phone: teacher.phone || "",
        studentType: teacher.studentType || "none",
        status: teacher.status || TeacherStatus.ACTIVE,
        sallary:
          teacher.sallary !== null && teacher.sallary !== undefined
            ? String(teacher.sallary)
            : "",
        notes: teacher.notes || "",
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        studentType: "none",
        status: TeacherStatus.ACTIVE,
        sallary: "",
        notes: "",
      });
    }
  }, [teacher, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      toast.error(t("toasts.nameRequired"));
      return;
    }

    const parsedSallary =
      formData.sallary.trim() === "" ? null : Number(formData.sallary);

    const payload: CreateTeacherDTO = {
      name: trimmedName,
      phone: formData.phone.trim() || null,
      studentType:
        formData.studentType !== "none"
          ? (formData.studentType as TeacherStudentType)
          : null,
      status: formData.status,
      sallary:
        parsedSallary !== null && !isNaN(parsedSallary) ? parsedSallary : null,
      notes: formData.notes.trim() || null,
    };

    try {
      setIsSubmitting(true);
      if (isEditing && teacher) {
        await apiClient.teachers.update(
          teacher.id,
          payload as UpdateTeacherDTO,
        );
        toast.success(t("toasts.updated"));
      } else {
        await apiClient.teachers.create(payload);
        toast.success(t("toasts.created"));
      }
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(t("toasts.loadFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing && teacher
              ? t("dialogs.editTitle", { name: teacher.name })
              : t("dialogs.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("dialogs.editDescription")
              : t("dialogs.addDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Row 1: Name */}
          <div className="space-y-1.5">
            <Label htmlFor="teacher-name">
              {t("dialogs.nameLabel")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="teacher-name"
              required
              placeholder={t("dialogs.namePlaceholder")}
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          {/* Row 2: Phone & Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="teacher-phone">{t("dialogs.phoneLabel")}</Label>
              <Input
                id="teacher-phone"
                dir="ltr"
                placeholder={t("dialogs.phonePlaceholder")}
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="teacher-sallary">
                {t("dialogs.sallaryLabel")}
              </Label>
              <Input
                id="teacher-sallary"
                type="number"
                min={0}
                step={1}
                placeholder={t("dialogs.sallaryPlaceholder")}
                value={formData.sallary}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sallary: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Row 3: Teaching Track & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("dialogs.studentTypeLabel")}</Label>
              <Select
                value={formData.studentType}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, studentType: val }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("dialogs.studentTypePlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {t("dialogs.noStudentType")}
                  </SelectItem>
                  <SelectItem value={TeacherStudentType.FOUNDATION}>
                    {t("studentTypes.foundation")}
                  </SelectItem>
                  <SelectItem value={TeacherStudentType.KHATIMEEN}>
                    {t("studentTypes.khatimeen")}
                  </SelectItem>
                  <SelectItem value={TeacherStudentType.CHILDREN}>
                    {t("studentTypes.children")}
                  </SelectItem>
                  <SelectItem value={TeacherStudentType.ADULTS}>
                    {t("studentTypes.adults")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("dialogs.statusLabel")}</Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: val as TeacherStatus,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TeacherStatus.ACTIVE}>
                    {t("statuses.active")}
                  </SelectItem>
                  <SelectItem value={TeacherStatus.ARCHIVED}>
                    {t("statuses.archived")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Administrative & Qualifications Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="teacher-notes">{t("dialogs.notesLabel")}</Label>
            <Textarea
              id="teacher-notes"
              rows={3}
              placeholder={t("dialogs.notesPlaceholder")}
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {t("dialogs.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting
                ? t("dialogs.saving")
                : isEditing
                  ? t("dialogs.save")
                  : t("dialogs.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
