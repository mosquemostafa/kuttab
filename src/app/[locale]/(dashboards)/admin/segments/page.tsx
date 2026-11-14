import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SegmentsTable } from "@/components/admin/segments-table";

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

  const title = t("admin.segments.title");
  const description = t("admin.segments.description");

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

export default function SegmantsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <SegmentsTable />
    </div>
  );
}
