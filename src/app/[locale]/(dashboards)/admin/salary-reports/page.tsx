import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SalaryReportView } from "@/components/admin/salary-reports/salary-report-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = t("admin.salaryReports.title");
  const description = t("admin.salaryReports.description");

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default function SalaryReportsPage() {
  return (
    <div className="p-4 md:p-6">
      <SalaryReportView />
    </div>
  );
}
