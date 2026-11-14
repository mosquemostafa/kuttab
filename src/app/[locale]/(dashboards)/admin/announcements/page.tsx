import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminAnnouncementsPanel } from "@/components/admin/admin-announcements-panel";
import { AdminAnnouncementsAnalytics } from "@/components/admin/admin-announcements-analytics";

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

  const title = t("admin.announcements.title");
  const description = t("admin.announcements.description");

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

export default function AdminAnnouncementsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <AdminAnnouncementsAnalytics />
      <AdminAnnouncementsPanel />
    </div>
  );
}
