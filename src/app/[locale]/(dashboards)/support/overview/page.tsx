import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SupportStaffOverviewAnalytics } from "@/components/support/support-staff-overview-analytics";

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

  const title = t("support.overview.title");
  const description = t("support.overview.description");

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

export default async function SupportOverviewPage() {
  return (
    <section className="container mx-auto max-w-6xl px-4 py-8">
      <SupportStaffOverviewAnalytics />
    </section>
  );
}
