import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TeachersTable } from "@/components/admin/teachers/teachers-table";

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

  const title = t("admin.teachers.title");
  const description = t("admin.teachers.description");

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

export default function TeachersPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <TeachersTable />
    </div>
  );
}
