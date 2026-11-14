import type { Metadata } from "next";
import { RegistrationSettingsCard } from "@/components/admin/registration-settings-card";
import { appSettingsService } from "@/server/modules/app-settings/app-settings.service";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "metadata",
  });
  const title = t("admin.settings.title");
  const description = t("admin.settings.description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function AdminSettingsPage() {
  const t = await getTranslations("adminSettings");
  const settings = await appSettingsService.getSettings();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("page.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("page.description")}</p>
      </div>

      <div className="space-y-6">
        <RegistrationSettingsCard
          initialOrganizationName={settings.organizationName}
          initialAllowSelfRegistration={settings.allowSelfRegistration}
          initialRequireEmailVerification={settings.requireEmailVerification}
          initialSendSupportTicketConfirmationEmail={
            settings.sendSupportTicketConfirmationEmail
          }
          initialSendFeedbackConfirmationEmail={
            settings.sendFeedbackConfirmationEmail
          }
          initialForceSingleActiveSession={settings.forceSingleActiveSession}
          initialSendNewsletterWelcomeEmail={
            settings.sendNewsletterWelcomeEmail
          }
        />
      </div>
    </div>
  );
}
