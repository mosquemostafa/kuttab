import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminOverviewAnalytics } from "@/components/admin/admin-overview-analytics";

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

  const title = t("admin.overview.title");
  const description = t("admin.overview.description");

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

export default function AdminOverviewPage() {
  return (
    <section className="container mx-auto max-w-7xl px-4 py-8">
      <AdminOverviewAnalytics />
    </section>
  );
}
