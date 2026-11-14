import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminUserSubscriptionsUserInfo } from "@/components/admin/admin-user-subscriptions-user-info";
import { AdminUserSubscriptionsDetails } from "@/components/admin/admin-user-subscriptions-details";
import { AdminUserSubscriptionEvents } from "@/components/admin/admin-user-subscription-events";
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

  const title = `${t("actions.viewSubscriptions")} • ${userId}`;

  return {
    title,
  };
}

export default async function AdminUserSubscriptionsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const t = await getTranslations("adminUsers");

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("actions.viewSubscriptions")}
        </h1>
      </div>

      <AdminUserSubscriptionsUserInfo userId={userId} />
      <AdminUserSubscriptionsDetails userId={userId} />
      <AdminUserSubscriptionEvents userId={userId} />
      <AdminUserSubscriptionInvoices userId={userId} />
    </div>
  );
}
