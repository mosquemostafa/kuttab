import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminFcmTopicPushPanel } from "@/components/admin/admin-fcm-topic-push-panel";

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

  const title = t("admin.notifications.title");
  const description = t("admin.notifications.description");

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

export default function AdminNotificationsPage() {
  return (
    <div className="flex w-full flex-1 flex-col items-center gap-6 p-4 md:p-6">
      <AdminFcmTopicPushPanel />
    </div>
  );
}
