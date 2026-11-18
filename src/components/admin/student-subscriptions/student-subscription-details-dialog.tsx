"use client";

import { format, parseISO } from "date-fns";
import type { Locale } from "date-fns";
import { CalendarDays, GraduationCap, WalletCards } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { StudentSubscriptionDTO } from "@/shared/types/student-subscription.types";
import { StudentSubscriptionTypeBadge } from "./student-subscription-columns";

interface StudentSubscriptionDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (subscription: StudentSubscriptionDTO) => void;
  subscription: StudentSubscriptionDTO | null;
  studentName: string;
  locale: string;
  dateLocale: Locale;
}

export function StudentSubscriptionDetailsDialog({
  isOpen,
  onClose,
  onEdit,
  subscription,
  studentName,
  locale,
  dateLocale,
}: StudentSubscriptionDetailsDialogProps) {
  const t = useTranslations("adminStudentSubscriptions");
  if (!subscription) return null;

  const numberFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("details.title")}</DialogTitle>
          <DialogDescription>{t("details.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <GraduationCap />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{studentName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {subscription.studentId}
              </p>
            </div>
          </div>

          <Separator />

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">
                {t("columns.amount")}
              </dt>
              <dd className="flex items-center gap-2 font-medium tabular-nums">
                <WalletCards />
                {numberFormatter.format(subscription.amount)}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">
                {t("columns.type")}
              </dt>
              <dd>
                <StudentSubscriptionTypeBadge type={subscription.type} />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">
                {t("columns.date")}
              </dt>
              <dd className="flex items-center gap-2 text-sm">
                <CalendarDays />
                <time dateTime={subscription.date}>
                  {format(parseISO(subscription.date), "PP", {
                    locale: dateLocale,
                  })}
                </time>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">
                {t("details.createdAt")}
              </dt>
              <dd className="text-sm">
                {format(new Date(subscription.createdAt), "PPp", {
                  locale: dateLocale,
                })}
              </dd>
            </div>
          </dl>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("dialogs.close")}
          </Button>
          <Button onClick={() => onEdit(subscription)}>
            {t("actions.edit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
