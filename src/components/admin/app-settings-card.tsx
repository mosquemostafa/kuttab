"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { apiClient } from "@/lib/api/api-client";
import { useApiErrorMessage } from "@/lib/api/use-api-error-message";
import {
  AttendanceDeductionType,
  type DeductionDays,
} from "@/shared/types/teacher-attendance.types";

type AppSettingsCardProps = {
  initialOrganizationName: string;
  initialAllowSelfRegistration: boolean;
  initialRequireEmailVerification: boolean;
  initialSendSupportTicketConfirmationEmail: boolean;
  initialSendFeedbackConfirmationEmail: boolean;
  initialForceSingleActiveSession: boolean;
  initialSendNewsletterWelcomeEmail: boolean;
  initialWorkingDays?: number[];
  initialDeductionDays: DeductionDays;
};

export function AppSettingsCard({
  initialOrganizationName,
  initialAllowSelfRegistration,
  initialRequireEmailVerification,
  initialSendSupportTicketConfirmationEmail,
  initialSendFeedbackConfirmationEmail,
  initialForceSingleActiveSession,
  initialSendNewsletterWelcomeEmail,
  initialWorkingDays = [0, 1, 2, 3, 4],
  initialDeductionDays,
}: AppSettingsCardProps) {
  const [organizationName, setOrganizationName] = useState(
    initialOrganizationName,
  );
  const [allowSelfRegistration, setAllowSelfRegistration] = useState(
    initialAllowSelfRegistration,
  );
  const [requireEmailVerification, setRequireEmailVerification] = useState(
    initialRequireEmailVerification,
  );
  const [
    sendSupportTicketConfirmationEmail,
    setSendSupportTicketConfirmationEmail,
  ] = useState(initialSendSupportTicketConfirmationEmail);
  const [sendFeedbackConfirmationEmail, setSendFeedbackConfirmationEmail] =
    useState(initialSendFeedbackConfirmationEmail);
  const [forceSingleActiveSession, setForceSingleActiveSession] = useState(
    initialForceSingleActiveSession,
  );
  const [sendNewsletterWelcomeEmail, setSendNewsletterWelcomeEmail] = useState(
    initialSendNewsletterWelcomeEmail,
  );
  const [workingDays, setWorkingDays] = useState<number[]>(initialWorkingDays);
  const [deductionDays, setDeductionDays] =
    useState<DeductionDays>(initialDeductionDays);
  const t = useTranslations("adminSettings");
  const getErrorMessage = useApiErrorMessage();
  const [isSaving, setIsSaving] = useState(false);

  const dayOptions = [
    { day: 0, label: t("fields.days.0") },
    { day: 1, label: t("fields.days.1") },
    { day: 2, label: t("fields.days.2") },
    { day: 3, label: t("fields.days.3") },
    { day: 4, label: t("fields.days.4") },
    { day: 5, label: t("fields.days.5") },
    { day: 6, label: t("fields.days.6") },
  ];

  const deductionOptions = [
    {
      period: AttendanceDeductionType.EXCUSED_ABSENCE,
      label: t("fields.attendanceDeductionTypes.excused_absence"),
    },
    {
      period: AttendanceDeductionType.FROM_35_TO_45_MIN,
      label: t("fields.attendanceDeductionTypes.from_35_to_45_min"),
    },
    {
      period: AttendanceDeductionType.FROM_45_TO_60_MIN,
      label: t("fields.attendanceDeductionTypes.from_45_to_60_min"),
    },
    {
      period: AttendanceDeductionType.MORE_THAN_60_MIN,
      label: t("fields.attendanceDeductionTypes.more_than_60_min"),
    },
  ];

  const toggleDay = (day: number) => {
    setWorkingDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) {
          toast.error(t("fields.workingDaysMinError"));
          return prev;
        }
        return prev.filter((d) => d !== day).sort((a, b) => a - b);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const handleSave = async () => {
    if (workingDays.length === 0) {
      toast.error(t("fields.workingDaysMinError"));
      return;
    }

    const hasInvalidDeduction = Object.values(deductionDays).some(
      (value) =>
        !Number.isFinite(value) ||
        value < 0 ||
        value > 30,
    );
    if (hasInvalidDeduction) {
      toast.error(t("fields.deductionInvalid"));
      return;
    }

    setIsSaving(true);

    try {
      const data = await apiClient.admin.updateSettings({
        organizationName,
        allowSelfRegistration,
        requireEmailVerification,
        sendSupportTicketConfirmationEmail,
        sendFeedbackConfirmationEmail,
        forceSingleActiveSession,
        sendNewsletterWelcomeEmail,
        workingDays,
        deductionDays,
      });

      toast.success(t("actions.savedSuccess"));

      setOrganizationName(data.organizationName);
      setAllowSelfRegistration(data.allowSelfRegistration);
      setRequireEmailVerification(data.requireEmailVerification);
      setSendSupportTicketConfirmationEmail(
        data.sendSupportTicketConfirmationEmail,
      );
      setSendFeedbackConfirmationEmail(data.sendFeedbackConfirmationEmail);
      setForceSingleActiveSession(data.forceSingleActiveSession);
      setSendNewsletterWelcomeEmail(data.sendNewsletterWelcomeEmail);
      setWorkingDays(data.workingDays ?? [0, 1, 2, 3, 4]);
      setDeductionDays(data.deductionDays);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("card.title")}</CardTitle>
        <CardDescription>{t("card.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="organization-name">
            {t("fields.organizationName")}
          </Label>
          <Input
            id="organization-name"
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">
              {t("fields.allowSelfRegistration")}
            </p>
            <p className="text-xs text-muted-foreground">
              {allowSelfRegistration
                ? t("fields.allowSelfRegistrationEnabled")
                : t("fields.allowSelfRegistrationDisabled")}
            </p>
          </div>
          <Switch
            checked={allowSelfRegistration}
            onCheckedChange={setAllowSelfRegistration}
            aria-label="Toggle self-registration"
          />
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">
              {t("fields.requireEmailVerification")}
            </p>
            <p className="text-xs text-muted-foreground">
              {requireEmailVerification
                ? t("fields.requireEmailVerificationEnabled")
                : t("fields.requireEmailVerificationDisabled")}
            </p>
          </div>
          <Switch
            checked={requireEmailVerification}
            onCheckedChange={setRequireEmailVerification}
            aria-label="Toggle email verification requirement"
          />
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">
              {t("fields.sendSupportTicketConfirmationEmail")}
            </p>
            <p className="text-xs text-muted-foreground">
              {sendSupportTicketConfirmationEmail
                ? t("fields.sendSupportTicketConfirmationEmailEnabled")
                : t("fields.sendSupportTicketConfirmationEmailDisabled")}
            </p>
          </div>
          <Switch
            checked={sendSupportTicketConfirmationEmail}
            onCheckedChange={setSendSupportTicketConfirmationEmail}
            aria-label="Toggle support ticket confirmation emails"
          />
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">
              {t("fields.sendFeedbackConfirmationEmail")}
            </p>
            <p className="text-xs text-muted-foreground">
              {sendFeedbackConfirmationEmail
                ? t("fields.sendFeedbackConfirmationEmailEnabled")
                : t("fields.sendFeedbackConfirmationEmailDisabled")}
            </p>
          </div>
          <Switch
            checked={sendFeedbackConfirmationEmail}
            onCheckedChange={setSendFeedbackConfirmationEmail}
            aria-label="Toggle feedback confirmation emails"
          />
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">
              {t("fields.sendNewsletterWelcomeEmail")}
            </p>
            <p className="text-xs text-muted-foreground">
              {sendNewsletterWelcomeEmail
                ? t("fields.sendNewsletterWelcomeEmailEnabled")
                : t("fields.sendNewsletterWelcomeEmailDisabled")}
            </p>
          </div>
          <Switch
            checked={sendNewsletterWelcomeEmail}
            onCheckedChange={setSendNewsletterWelcomeEmail}
            aria-label="Toggle newsletter welcome email on subscribe"
          />
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">
              {t("fields.forceSingleActiveSession")}
            </p>
            <p className="text-xs text-muted-foreground">
              {forceSingleActiveSession
                ? t("fields.forceSingleActiveSessionEnabled")
                : t("fields.forceSingleActiveSessionDisabled")}
            </p>
          </div>
          <Switch
            checked={forceSingleActiveSession}
            onCheckedChange={setForceSingleActiveSession}
            aria-label="Toggle single active session"
          />
        </div>

        <div className="space-y-3 rounded-md border p-4">
          <div>
            <p className="text-sm font-medium">{t("fields.workingDays")}</p>
            <p className="text-xs text-muted-foreground">
              {t("fields.workingDaysDescription")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {dayOptions.map(({ day, label }) => {
              const isSelected = workingDays.includes(day);
              return (
                <Button
                  key={day}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(day)}
                  className="min-w-20"
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 rounded-md border p-4">
          <div>
            <p className="text-sm font-medium">
              {t("fields.attendanceDeductions")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("fields.attendanceDeductionsDescription")}
            </p>
          </div>

          <div className="divide-y rounded-lg border bg-muted/20">
            <div className="flex min-h-16 items-center justify-between gap-3 px-3 py-2.5">
              <Label htmlFor="absence-deduction" className="flex-1">
                {t("fields.attendanceDeductionTypes.absence")}
              </Label>
              <div className="flex shrink-0 items-center gap-2">
                <Input
                  id="absence-deduction"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={30}
                  step="any"
                  value={deductionDays.absence}
                  onChange={(event) =>
                    setDeductionDays((current) => ({
                      ...current,
                      absence: Number(event.target.value),
                    }))
                  }
                  className="h-10 w-24 text-center tabular-nums"
                />
                <span className="w-9 text-xs text-muted-foreground">
                  {t("fields.deductionUnit")}
                </span>
              </div>
            </div>
            {deductionOptions.map(({ period, label }) => (
              <div
                key={period}
                className="flex min-h-16 items-center justify-between gap-3 px-3 py-2.5"
              >
                <Label
                  htmlFor={`attendance-deduction-${period}`}
                  className="flex-1"
                >
                  {label}
                </Label>
                <div className="flex shrink-0 items-center gap-2">
                  <Input
                    id={`attendance-deduction-${period}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={30}
                    step="any"
                    value={deductionDays[period]}
                    onChange={(event) =>
                      setDeductionDays((current) => ({
                        ...current,
                        [period]: Number(event.target.value),
                      }))
                    }
                    className="h-10 w-24 text-center tabular-nums"
                  />
                  <span className="w-9 text-xs text-muted-foreground">
                    {t("fields.deductionUnit")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? t("actions.saving") : t("actions.save")}
        </Button>
      </CardContent>
    </Card>
  );
}
