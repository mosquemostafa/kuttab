import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { StudentsTable } from "@/components/admin/students/students-table";

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

  const title = t("admin.students.title");
  const description = t("admin.students.description");

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

export default function StudentsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <StudentsTable />
    </div>
  );
}
