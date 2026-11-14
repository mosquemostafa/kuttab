import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SupportTicketsPanel } from "@/components/dashboard/support/support-tickets-panel";

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

  const title = t("dashboard.support.title");
  const description = t("dashboard.support.description");

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

const DashboardSupportPage = () => {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <SupportTicketsPanel />
    </div>
  );
};

export default DashboardSupportPage;
