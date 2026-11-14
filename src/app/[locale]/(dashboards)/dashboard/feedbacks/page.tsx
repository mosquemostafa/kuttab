import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { FeedbacksPanel } from "@/components/dashboard/feedbacks/feedbacks-panel";

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

  const title = t("dashboard.feedbacks.title");
  const description = t("dashboard.feedbacks.description");

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

export default function DashboardFeedbacksPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <FeedbacksPanel />
    </div>
  );
}
