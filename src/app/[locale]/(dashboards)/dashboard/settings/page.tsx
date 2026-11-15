import type { Metadata } from "next";
import { headers } from "next/headers";
import ChangePasswordForm from "@/components/dashboard/change-password-form";
import PersonalInformationForm from "@/components/dashboard/personal-information-form";
import LinkedAccounts from "@/components/dashboard/linked-accounts";
import LanguageSettings from "@/components/dashboard/language-settings";
import ThemeSettings from "@/components/dashboard/theme-settings";
import NewsletterSettings from "@/components/dashboard/newsletter-settings";
import NotificationSettings from "@/components/dashboard/notification-settings";
import DeleteAccountCard from "@/components/dashboard/delete-account-card";
import { PWAInstallCard } from "@/components/dashboard/pwa-install-card";
import { getLocale, getTranslations } from "next-intl/server";
import {
  fetchDashboardSettingsBootstrap,
  type DashboardSettingsBootstrap,
} from "@/lib/api/api-server";

const emptyDashboardSettings: DashboardSettingsBootstrap = {
  name: "",
  email: "",
  phone: "",
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

export default async function UserSettingsPage() {
  const t = await getTranslations("settings");
  await getLocale();

  const dashboardSettings = await getDashboardSettingsBootstrap();

  const userProfile = {
    name: dashboardSettings.name,
    email: dashboardSettings.email,
    phone: dashboardSettings.phone,
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

      <div className="space-y-6">
        <PersonalInformationForm initialValues={userProfile} />

        <PWAInstallCard />

        <LinkedAccounts
          currentImage={userProfile.image}
          userName={userProfile.name}
          avatarR2UploadEnabled={dashboardSettings.avatarR2UploadEnabled}
        />

        <LanguageSettings />

        <ThemeSettings />

        <NotificationSettings />

        <NewsletterSettings accountEmail={userProfile.email} />

        <ChangePasswordForm hasPasswordLogin={canUsePasswordLogin} />

        <DeleteAccountCard />
      </div>
    </div>
  );
}
