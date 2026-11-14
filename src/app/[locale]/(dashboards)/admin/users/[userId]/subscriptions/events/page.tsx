import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminUserSubscriptionEvents } from "@/components/admin/admin-user-subscription-events";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}): Promise<Metadata> {
  const { locale, userId } = await params;
  const t = await getTranslations({
    locale,
    namespace: "adminUsers",
  });

  return {
    title: `${t("subscriptionEvents.title")} • ${userId}`,
  };
}

export default async function AdminUserSubscriptionEventsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <AdminUserSubscriptionEvents userId={userId} />
    </div>
  );
}
