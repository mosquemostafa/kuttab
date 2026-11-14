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

type RegistrationSettingsCardProps = {
  initialOrganizationName: string;
  initialAllowSelfRegistration: boolean;
  initialRequireEmailVerification: boolean;
  initialSendSupportTicketConfirmationEmail: boolean;
  initialSendFeedbackConfirmationEmail: boolean;
  initialForceSingleActiveSession: boolean;
  initialSendNewsletterWelcomeEmail: boolean;
};

export function RegistrationSettingsCard({
  initialOrganizationName,
  initialAllowSelfRegistration,
  initialRequireEmailVerification,
  initialSendSupportTicketConfirmationEmail,
  initialSendFeedbackConfirmationEmail,
  initialForceSingleActiveSession,
  initialSendNewsletterWelcomeEmail,
}: RegistrationSettingsCardProps) {
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
  const t = useTranslations("adminSettings");
  const getErrorMessage = useApiErrorMessage();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
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

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? t("actions.saving") : t("actions.save")}
        </Button>
      </CardContent>
    </Card>
  );
}
