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
import { RelationSelect } from "@/components/ui/relation-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api/api-client";
import { ClassType } from "@/shared/enums/class-type.enum";
import type { ClassDTO } from "@/shared/types/class.types";
import type {
  CreateClassDTO,
  UpdateClassDTO,
} from "@/server/modules/classes/class.dto";

interface ClassFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classItem?: ClassDTO | null;
}

export function ClassFormDialog({
  isOpen,
  onClose,
  onSuccess,
  classItem,
}: ClassFormDialogProps) {
  const t = useTranslations("adminClasses");
  const isEditing = Boolean(classItem);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogContainer, setDialogContainer] = useState<HTMLDivElement | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    classType: ClassType.GROUP as ClassType,
    primaryTeacherId: "none",
    secondaryTeacherId: "none",
  });

  // Populate on edit or reset on create
  useEffect(() => {
    if (classItem) {
      setFormData({
        name: classItem.name || "",
        classType: classItem.classType || ClassType.GROUP,
        primaryTeacherId: classItem.primaryTeacherId || "none",
        secondaryTeacherId: classItem.secondaryTeacherId || "none",
      });
    } else {
      setFormData({
        name: "",
        classType: ClassType.GROUP,
        primaryTeacherId: "none",
        secondaryTeacherId: "none",
      });
    }
  }, [classItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t("toasts.nameRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      setIsSubmitting(true);
      if (isEditing && classItem) {
        const payload: UpdateClassDTO = {
          name: formData.name.trim(),
          classType: formData.classType,
          primaryTeacherId:
            formData.primaryTeacherId === "none"
              ? null
              : formData.primaryTeacherId,
          secondaryTeacherId:
            formData.secondaryTeacherId === "none"
              ? null
              : formData.secondaryTeacherId,
        };

        await apiClient.classes.update(classItem.id, payload);
        toast.success(t("toasts.updated"));
      } else {
        const payload: CreateClassDTO = {
          name: formData.name.trim(),
          classType: formData.classType,
          primaryTeacherId:
            formData.primaryTeacherId === "none"
              ? null
              : formData.primaryTeacherId,
          secondaryTeacherId:
            formData.secondaryTeacherId === "none"
              ? null
              : formData.secondaryTeacherId,
        };

        await apiClient.classes.create(payload);
        toast.success(t("toasts.created"));
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("toasts.loadFailed");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        ref={setDialogContainer}
        className="max-w-md max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t("dialogs.editTitle", { name: classItem?.name ?? "" })
              : t("dialogs.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("dialogs.editDescription")
              : t("dialogs.addDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Class Name */}
          <div className="space-y-2">
            <Label htmlFor="class-name">
              {t("dialogs.nameLabel")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="class-name"
              required
              placeholder={t("dialogs.namePlaceholder")}
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={isSubmitting}
            />
          </div>

          {/* Class Type */}
          <div className="space-y-2">
            <Label htmlFor="class-type">{t("dialogs.classTypeLabel")}</Label>
            <Select
              value={formData.classType}
              onValueChange={(val: ClassType) =>
                setFormData((prev) => ({ ...prev, classType: val }))
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="class-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ClassType.GROUP}>
                  {t("classTypes.group")}
                </SelectItem>
                <SelectItem value={ClassType.INDIVIDUAL}>
                  {t("classTypes.individual")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Primary Teacher */}
          <div className="space-y-2">
            <Label htmlFor="primary-teacher">
              {t("dialogs.primaryTeacherLabel")}
            </Label>
            <RelationSelect
              endpoint="/teachers/select"
              value={formData.primaryTeacherId}
              selectedOption={
                classItem?.primaryTeacherId && classItem.primaryTeacherName
                  ? {
                      id: classItem.primaryTeacherId,
                      name: classItem.primaryTeacherName,
                    }
                  : null
              }
              onValueChange={(primaryTeacherId) =>
                setFormData((prev) => ({ ...prev, primaryTeacherId }))
              }
              placeholder={t("dialogs.primaryTeacherPlaceholder")}
              id="primary-teacher"
              emptyOption={{
                value: "none",
                label: t("dialogs.unassigned"),
              }}
              enabled={isOpen}
              disabled={isSubmitting}
              container={dialogContainer}
            />
          </div>

          {/* Secondary Teacher */}
          <div className="space-y-2">
            <Label htmlFor="secondary-teacher">
              {t("dialogs.secondaryTeacherLabel")}
            </Label>
            <RelationSelect
              endpoint="/teachers/select"
              value={formData.secondaryTeacherId}
              selectedOption={
                classItem?.secondaryTeacherId &&
                classItem.secondaryTeacherName
                  ? {
                      id: classItem.secondaryTeacherId,
                      name: classItem.secondaryTeacherName,
                    }
                  : null
              }
              onValueChange={(secondaryTeacherId) =>
                setFormData((prev) => ({ ...prev, secondaryTeacherId }))
              }
              placeholder={t("dialogs.secondaryTeacherPlaceholder")}
              id="secondary-teacher"
              emptyOption={{
                value: "none",
                label: t("dialogs.unassigned"),
              }}
              enabled={isOpen}
              disabled={isSubmitting}
              container={dialogContainer}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t("dialogs.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
