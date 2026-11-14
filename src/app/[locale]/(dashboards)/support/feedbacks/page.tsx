import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { FeedbacksManagementTable } from "@/components/support/feedbacks-management-table";

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

  const title = t("support.feedbacks.title");
  const description = t("support.feedbacks.description");

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

export default function SupportFeedbacksPage() {
  return (
    <section className="container mx-auto max-w-5xl px-4 py-8">
      <FeedbacksManagementTable />
    </section>
  );
}
