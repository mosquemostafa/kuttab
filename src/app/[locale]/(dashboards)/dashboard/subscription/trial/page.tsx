import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import TrialStart from "@/components/dashboard/subscription/subscription-trial-start";

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

  const title = t("dashboard.trial.title");
  const description = t("dashboard.trial.description");

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

export default function DashboardTrialPage() {
  return <TrialStart />;
}
