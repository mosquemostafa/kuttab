import type { Metadata } from "next";
import { headers } from "next/headers";
import ChangePasswordForm from "@/components/dashboard/change-password-form";
import PersonalInformationForm from "@/components/dashboard/personal-information-form";
import LinkedAccounts from "@/components/dashboard/linked-accounts";
import LanguageSettings from "@/components/dashboard/language-settings";
import ThemeSettings from "@/components/dashboard/theme-settings";
import AccentColorSettings from "@/components/dashboard/accent-color-settings";
import NewsletterSettings from "@/components/dashboard/newsletter-settings";
import NotificationSettings from "@/components/dashboard/notification-settings";
import DeleteAccountCard from "@/components/dashboard/delete-account-card";
import { CurrentSubscriptionCard } from "@/components/dashboard/subscription/current-subscription-card";
import { PWAInstallCard } from "@/components/dashboard/pwa-install-card";
import { getLocale, getTranslations } from "next-intl/server";
import {
  fetchDashboardSettingsBootstrap,
  type DashboardSettingsBootstrap,
} from "@/lib/api/api-server";

const emptyDashboardSettings: DashboardSettingsBootstrap = {
  name: "",
  email: "",
  image: null,
  hasPasswordLogin: false,
  avatarR2UploadEnabled: false,
};

async function getDashboardSettingsBootstrap(): Promise<DashboardSettingsBootstrap> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) {
    return emptyDashboardSettings;
  }

  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const cookie = requestHeaders.get("cookie") ?? "";

  return fetchDashboardSettingsBootstrap({ protocol, host, cookie });
}

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

  const title = t("dashboard.settings.title");
  const description = t("dashboard.settings.description");

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

export default async function UserSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; linked?: string }>;
}) {
  const t = await getTranslations("settings");
  await getLocale();
  const params = await searchParams;

  let linkErrorMessage = null;
  if (params.error === "email_doesn't_match") {
    linkErrorMessage = t("errors.emailDoesntMatch");
  } else if (params.error === "unable_to_link_account") {
    linkErrorMessage = t("errors.unableToLinkAccount");
  } else if (params.error === "account_already_linked_to_different_user") {
    linkErrorMessage = t("errors.accountAlreadyLinkedToDifferentUser");
  } else if (params.error) {
    linkErrorMessage = t("errors.unableToLinkAccount");
  }

  const linkSuccessMessage =
    params.linked === "success" ? t("success.linked") : null;

  const dashboardSettings = await getDashboardSettingsBootstrap();

  const userProfile = {
    name: dashboardSettings.name,
    email: dashboardSettings.email,
    image: dashboardSettings.image,
  };
  const canUsePasswordLogin = dashboardSettings.hasPasswordLogin;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("page.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("page.description")}</p>
      </div>

      {linkErrorMessage && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {linkErrorMessage}
        </div>
      )}

      {linkSuccessMessage && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {linkSuccessMessage}
        </div>
      )}

      <div className="space-y-6">
        <PersonalInformationForm initialValues={userProfile} />

        <CurrentSubscriptionCard />

        <PWAInstallCard />

        <LinkedAccounts
          currentImage={userProfile.image}
          userName={userProfile.name}
          avatarR2UploadEnabled={dashboardSettings.avatarR2UploadEnabled}
        />

        <LanguageSettings />

        <ThemeSettings />

        <AccentColorSettings />

        <NotificationSettings />

        <NewsletterSettings accountEmail={userProfile.email} />

        <ChangePasswordForm hasPasswordLogin={canUsePasswordLogin} />

        <DeleteAccountCard />
      </div>
    </div>
  );
}
