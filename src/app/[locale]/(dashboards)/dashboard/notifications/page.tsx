import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { NotificationsPanel } from "@/components/dashboard/notifications/notifications-panel";

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

  const title = t("dashboard.notifications.title");
  const description = t("dashboard.notifications.description");

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

export default function DashboardNotificationsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <NotificationsPanel />
    </div>
  );
}
