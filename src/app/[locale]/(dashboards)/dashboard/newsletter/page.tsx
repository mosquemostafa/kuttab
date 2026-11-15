import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import { DashboardNewsletterChannelList } from "@/components/dashboard/dashboard-newsletter-channel-list";
import { DashboardNewsletterChannelSubscribeCta } from "@/components/dashboard/dashboard-newsletter-channel-subscribe-cta";
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

  const title = t("dashboard.newsletterChannel.list.title");
  const description = t("dashboard.newsletterChannel.list.description");

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function DashboardNewsletterChannelPage() {
  const t = await getTranslations("newsletterChannel.list");
  const dashboardSettings = await getDashboardSettingsBootstrap();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t("intro")}
        </p>
      </div>

      <DashboardNewsletterChannelSubscribeCta
        accountEmail={dashboardSettings.email}
        showHeader={false}
      />

      <div className="mt-10">
        <DashboardNewsletterChannelList />
      </div>
    </div>
  );
}
