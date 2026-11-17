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

type AppSettingsCardProps = {
  initialOrganizationName: string;
  initialAllowSelfRegistration: boolean;
  initialRequireEmailVerification: boolean;
  initialSendSupportTicketConfirmationEmail: boolean;
  initialSendFeedbackConfirmationEmail: boolean;
  initialForceSingleActiveSession: boolean;
  initialSendNewsletterWelcomeEmail: boolean;
  initialWorkingDays?: number[];
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

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? t("actions.saving") : t("actions.save")}
        </Button>
      </CardContent>
    </Card>
  );
}
