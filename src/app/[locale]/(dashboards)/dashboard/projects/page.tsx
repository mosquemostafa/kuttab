import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ProjectList } from "@/components/dashboard/projects/project-list";

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

  const title = t("dashboard.projects.title");
  const description = t("dashboard.projects.description");

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

export default function DashboardProjectsPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <ProjectList />
    </div>
  );
}
