"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";

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
import { RelationSelect } from "@/components/ui/relation-select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api/api-client";
import { StudentStatus } from "@/shared/enums/student-status.enum";
import { StudentPaymentMethod } from "@/shared/enums/student-payment-method.enum";
import type { StudentDTO } from "@/shared/types/student.types";
import type {
  CreateStudentDTO,
  UpdateStudentDTO,
} from "@/server/modules/students/student.dto";

interface StudentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student?: StudentDTO | null;
}

export function StudentFormDialog({
  isOpen,
  onClose,
  onSuccess,
  student,
}: StudentFormDialogProps) {
  const t = useTranslations("adminStudents");
  const locale = useLocale();
  const dateLocale = locale.startsWith("ar") ? ar : enUS;
  const isEditing = Boolean(student);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogContainer, setDialogContainer] = useState<HTMLDivElement | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    classId: "none",
    status: StudentStatus.ACTIVE as StudentStatus,
    paymentMethod: "none",
    birthDate: "",
    grade: "",
    job: "",
    studiedTajweed: false,
    previouslyEnrolled: false,
    previousEnrolledPlace: "",
    memorizedPartsCount: 0,
    memorizationDetails: "",
    registrationDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Populate form on edit or reset on create
  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || "",
        phone: student.phone || "",
        classId: student.classId || "none",
        status: student.status || StudentStatus.ACTIVE,
        paymentMethod: student.paymentMethod || "none",
        birthDate: student.birthDate ? student.birthDate.split("T")[0] : "",
        grade: student.grade || "",
        job: student.job || "",
        studiedTajweed: Boolean(student.studiedTajweed),
        previouslyEnrolled: Boolean(student.previouslyEnrolled),
        previousEnrolledPlace: student.previousEnrolledPlace || "",
        memorizedPartsCount: student.memorizedPartsCount ?? 0,
        memorizationDetails: student.memorizationDetails || "",
        registrationDate: student.registrationDate
          ? student.registrationDate.split("T")[0]
          : new Date().toISOString().split("T")[0],
        notes: student.notes || "",
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        classId: "none",
        status: StudentStatus.ACTIVE,
        paymentMethod: "none",
        birthDate: "",
        grade: "",
        job: "",
        studiedTajweed: false,
        previouslyEnrolled: false,
        previousEnrolledPlace: "",
        memorizedPartsCount: 0,
        memorizationDetails: "",
        registrationDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
  }, [student, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      toast.error(t("toasts.nameRequired"));
      return;
    }

    const payload: CreateStudentDTO = {
      name: trimmedName,
      phone: formData.phone.trim() || null,
      classId: formData.classId !== "none" ? formData.classId : null,
      status: formData.status,
      paymentMethod:
        formData.paymentMethod !== "none"
          ? (formData.paymentMethod as StudentPaymentMethod)
          : null,
      birthDate: formData.birthDate || null,
      grade: formData.grade.trim() || null,
      job: formData.job.trim() || null,
      studiedTajweed: formData.studiedTajweed,
      previouslyEnrolled: formData.previouslyEnrolled,
      previousEnrolledPlace: formData.previouslyEnrolled
        ? formData.previousEnrolledPlace.trim() || null
        : null,
      memorizedPartsCount: Number(formData.memorizedPartsCount) || 0,
      memorizationDetails: formData.memorizationDetails.trim() || null,
      registrationDate: formData.registrationDate || undefined,
      notes: formData.notes.trim() || null,
    };

    try {
      setIsSubmitting(true);
      if (isEditing && student) {
        await apiClient.students.update(
          student.id,
          payload as UpdateStudentDTO,
        );
        toast.success(t("toasts.updated"));
      } else {
        await apiClient.students.create(payload);
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
      <DialogContent
        ref={setDialogContainer}
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing && student
              ? t("dialogs.editTitle", { name: student.name })
              : t("dialogs.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("dialogs.editDescription")
              : t("dialogs.addDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="student-name">
                {t("dialogs.nameLabel")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="student-name"
                required
                placeholder={t("dialogs.namePlaceholder")}
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="student-phone">{t("dialogs.phoneLabel")}</Label>
              <Input
                id="student-phone"
                dir="ltr"
                placeholder={t("dialogs.phonePlaceholder")}
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Row 2: Class & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="student-class">{t("dialogs.classLabel")}</Label>
              <RelationSelect
                endpoint="/classes/select"
                value={formData.classId}
                selectedOption={
                  student?.classId && student.className
                    ? {
                        id: student.classId,
                        name: student.className,
                      }
                    : null
                }
                onValueChange={(classId) =>
                  setFormData((prev) => ({ ...prev, classId }))
                }
                placeholder={t("dialogs.classPlaceholder")}
                id="student-class"
                emptyOption={{ value: "none", label: t("dialogs.noClass") }}
                enabled={isOpen}
                disabled={isSubmitting}
                container={dialogContainer}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("dialogs.statusLabel")}</Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: val as StudentStatus,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={StudentStatus.ACTIVE}>
                    {t("statuses.active")}
                  </SelectItem>
                  <SelectItem value={StudentStatus.PENDING}>
                    {t("statuses.pending")}
                  </SelectItem>
                  <SelectItem value={StudentStatus.ARCHIVED}>
                    {t("statuses.archived")}
                  </SelectItem>
                  <SelectItem value={StudentStatus.REJECTED}>
                    {t("statuses.rejected")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Payment Method & Memorized Parts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("dialogs.paymentMethodLabel")}</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, paymentMethod: val }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("dialogs.paymentMethodPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {t("dialogs.noPaymentMethod")}
                  </SelectItem>
                  <SelectItem value={StudentPaymentMethod.MONTHLY}>
                    {t("paymentMethods.monthly")}
                  </SelectItem>
                  <SelectItem value={StudentPaymentMethod.YEARLY}>
                    {t("paymentMethods.yearly")}
                  </SelectItem>
                  <SelectItem value={StudentPaymentMethod.INSTALLMENTS}>
                    {t("paymentMethods.installments")}
                  </SelectItem>
                  <SelectItem value={StudentPaymentMethod.EXEMPT_POOR}>
                    {t("paymentMethods.exempt_poor")}
                  </SelectItem>
                  <SelectItem value={StudentPaymentMethod.EXEMPT_STAFF_KIDS}>
                    {t("paymentMethods.exempt_staff_kids")}
                  </SelectItem>
                  <SelectItem value={StudentPaymentMethod.SPECIAL}>
                    {t("paymentMethods.special")}
                  </SelectItem>
                  <SelectItem value={StudentPaymentMethod.SPONSORED}>
                    {t("paymentMethods.sponsored")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="student-parts">
                  {t("dialogs.memorizedPartsCountLabel")}
                </Label>
                <span className="text-xs text-muted-foreground font-mono">
                  {t("dialogs.partsOutOf30", {
                    count: formData.memorizedPartsCount,
                  })}
                </span>
              </div>
              <Input
                id="student-parts"
                type="number"
                min={0}
                max={30}
                value={formData.memorizedPartsCount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    memorizedPartsCount: Math.min(
                      30,
                      Math.max(0, Number(e.target.value)),
                    ),
                  }))
                }
              />
            </div>
          </div>

          {/* Row 4: Grade & Job */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="student-grade">{t("dialogs.gradeLabel")}</Label>
              <Input
                id="student-grade"
                placeholder={t("dialogs.gradePlaceholder")}
                value={formData.grade}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, grade: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="student-job">{t("dialogs.jobLabel")}</Label>
              <Input
                id="student-job"
                placeholder={t("dialogs.jobPlaceholder")}
                value={formData.job}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, job: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Row 5: Birth Date & Registration Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="student-birth">
                {t("dialogs.birthDateLabel")}
              </Label>
              <DatePicker
                id="student-birth"
                value={formData.birthDate}
                onChange={(birthDate) =>
                  setFormData((prev) => ({
                    ...prev,
                    birthDate,
                  }))
                }
                placeholder={t("dialogs.datePlaceholder")}
                ariaLabel={t("dialogs.birthDateLabel")}
                locale={dateLocale}
                disabled={isSubmitting}
                allowClear
                clearLabel={t("dialogs.clearDate")}
                container={dialogContainer}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="student-reg-date">
                {t("dialogs.registrationDateLabel")}
              </Label>
              <DatePicker
                id="student-reg-date"
                value={formData.registrationDate}
                onChange={(registrationDate) =>
                  setFormData((prev) => ({
                    ...prev,
                    registrationDate,
                  }))
                }
                placeholder={t("dialogs.datePlaceholder")}
                ariaLabel={t("dialogs.registrationDateLabel")}
                locale={dateLocale}
                disabled={isSubmitting}
                container={dialogContainer}
              />
            </div>
          </div>

          {/* Row 6: Switches (Tajweed & Previously Enrolled) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <Label
                  htmlFor="student-tajweed"
                  className="text-xs font-medium cursor-pointer"
                >
                  {t("dialogs.studiedTajweedLabel")}
                </Label>
              </div>
              <Switch
                id="student-tajweed"
                checked={formData.studiedTajweed}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, studiedTajweed: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <Label
                  htmlFor="student-enrolled"
                  className="text-xs font-medium cursor-pointer"
                >
                  {t("dialogs.previouslyEnrolledLabel")}
                </Label>
              </div>
              <Switch
                id="student-enrolled"
                checked={formData.previouslyEnrolled}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    previouslyEnrolled: checked,
                  }))
                }
              />
            </div>
          </div>

          {/* Conditional Previous School Name */}
          {formData.previouslyEnrolled && (
            <div className="space-y-1.5">
              <Label htmlFor="student-prev-place">
                {t("dialogs.previousEnrolledPlaceLabel")}
              </Label>
              <Input
                id="student-prev-place"
                placeholder={t("dialogs.previousEnrolledPlacePlaceholder")}
                value={formData.previousEnrolledPlace}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    previousEnrolledPlace: e.target.value,
                  }))
                }
              />
            </div>
          )}

          {/* Row 7: Memorization Details */}
          <div className="space-y-1.5">
            <Label htmlFor="student-mem-details">
              {t("dialogs.memorizationDetailsLabel")}
            </Label>
            <Input
              id="student-mem-details"
              placeholder={t("dialogs.memorizationDetailsPlaceholder")}
              value={formData.memorizationDetails}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  memorizationDetails: e.target.value,
                }))
              }
            />
          </div>

          {/* Row 8: Administrative Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="student-notes">{t("dialogs.notesLabel")}</Label>
            <Textarea
              id="student-notes"
              rows={2}
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
