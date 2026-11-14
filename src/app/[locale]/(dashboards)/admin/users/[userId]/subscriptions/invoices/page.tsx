import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminUserSubscriptionInvoices } from "@/components/admin/admin-user-subscription-invoices";

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
    title: `${t("subscriptionInvoices.title")} • ${userId}`,
  };
}

export default async function AdminUserSubscriptionInvoicesPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <AdminUserSubscriptionInvoices userId={userId} />
    </div>
  );
}
