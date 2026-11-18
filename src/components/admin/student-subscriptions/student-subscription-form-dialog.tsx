"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RelationSelect } from "@/components/ui/relation-select";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api/api-client";
import { DatePicker } from "@/components/ui/date-picker";
import type {
  CreateStudentSubscriptionDTO,
  UpdateStudentSubscriptionDTO,
} from "@/server/modules/student-subscriptions/student-subscription.dto";
import { StudentSubscriptionType } from "@/shared/enums/student-subscription-type.enum";
import type { StudentSubscriptionDTO } from "@/shared/types/student-subscription.types";
import { useSubscriptionTypeLabel } from "./use-subscription-type-label";

const SUBSCRIPTION_TYPES = Object.values(StudentSubscriptionType);

interface StudentSubscriptionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscription?: StudentSubscriptionDTO | null;
}

export function StudentSubscriptionFormDialog({
  isOpen,
  onClose,
  onSuccess,
  subscription,
}: StudentSubscriptionFormDialogProps) {
  const t = useTranslations("adminStudentSubscriptions");
  const locale = useLocale();
  const dateLocale = locale.startsWith("ar") ? ar : enUS;
  const getTypeLabel = useSubscriptionTypeLabel();
  const isEditing = Boolean(subscription);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [dialogContainer, setDialogContainer] = useState<HTMLDivElement | null>(
    null,
  );
  const [formData, setFormData] = useState({
    studentId: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    type: StudentSubscriptionType.MONTHLY,
  });

  useEffect(() => {
    setHasSubmitted(false);
    setFormData(
      subscription
        ? {
            studentId: subscription.studentId,
            amount: String(subscription.amount),
            date: subscription.date,
            type: subscription.type,
          }
        : {
            studentId: "",
            amount: "",
            date: new Date().toISOString().slice(0, 10),
            type: StudentSubscriptionType.MONTHLY,
          },
    );
  }, [isOpen, subscription]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setHasSubmitted(true);

    const amount = Number(formData.amount);
    if (!formData.studentId) {
      toast.error(t("toasts.studentRequired"));
      return;
    }
    if (!Number.isInteger(amount) || amount < 0) {
      toast.error(t("toasts.amountInvalid"));
      return;
    }
    if (!formData.date) {
      toast.error(t("toasts.dateRequired"));
      return;
    }

    const payload: CreateStudentSubscriptionDTO = {
      studentId: formData.studentId,
      amount,
      date: formData.date,
      type: formData.type,
    };

    try {
      setIsSubmitting(true);
      if (subscription) {
        await apiClient.studentSubscriptions.update(
          subscription.id,
          payload as UpdateStudentSubscriptionDTO,
        );
        toast.success(t("toasts.updated"));
      } else {
        await apiClient.studentSubscriptions.create(payload);
        toast.success(t("toasts.created"));
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("toasts.saveFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
    >
      <DialogContent ref={setDialogContainer} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("dialogs.editTitle") : t("dialogs.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("dialogs.editDescription")
              : t("dialogs.addDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4 py-2">
            <Field data-invalid={hasSubmitted && !formData.studentId}>
              <FieldLabel htmlFor="subscription-student">
                {t("dialogs.studentLabel")}
              </FieldLabel>
              <RelationSelect
                endpoint="/students/select"
                value={formData.studentId}
                selectedOption={
                  subscription
                    ? {
                        id: subscription.studentId,
                        name: subscription.studentName,
                      }
                    : null
                }
                onValueChange={(studentId) =>
                  setFormData((current) => ({ ...current, studentId }))
                }
                placeholder={t("dialogs.studentPlaceholder")}
                id="subscription-student"
                enabled={isOpen}
                disabled={isSubmitting}
                invalid={hasSubmitted && !formData.studentId}
                container={dialogContainer}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                data-invalid={
                  formData.amount !== "" &&
                  (!Number.isInteger(Number(formData.amount)) ||
                    Number(formData.amount) < 0)
                }
              >
                <FieldLabel htmlFor="subscription-amount">
                  {t("dialogs.amountLabel")}
                </FieldLabel>
                <Input
                  id="subscription-amount"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  required
                  value={formData.amount}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  aria-invalid={
                    formData.amount !== "" &&
                    (!Number.isInteger(Number(formData.amount)) ||
                      Number(formData.amount) < 0)
                  }
                />
              </Field>

              <Field data-invalid={!formData.date}>
                <FieldLabel htmlFor="subscription-date">
                  {t("dialogs.dateLabel")}
                </FieldLabel>
                <DatePicker
                  id="subscription-date"
                  value={formData.date}
                  onChange={(date) =>
                    setFormData((current) => ({
                      ...current,
                      date,
                    }))
                  }
                  placeholder={t("dialogs.datePlaceholder")}
                  ariaLabel={t("dialogs.dateLabel")}
                  locale={dateLocale}
                  disabled={isSubmitting}
                  invalid={!formData.date}
                  container={dialogContainer}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="subscription-type">
                {t("dialogs.typeLabel")}
              </FieldLabel>
              <Select
                value={formData.type}
                onValueChange={(type) =>
                  setFormData((current) => ({
                    ...current,
                    type: type as StudentSubscriptionType,
                  }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="subscription-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {SUBSCRIPTION_TYPES.map((subscriptionType) => (
                      <SelectItem
                        key={subscriptionType}
                        value={subscriptionType}
                      >
                        {getTypeLabel(subscriptionType)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <DialogFooter className="pt-4">
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
