import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TeacherAttendanceWorkspace } from "@/components/admin/teacher-attendances/teacher-attendance-workspace";
import { appSettingsService } from "@/server/modules/app-settings/app-settings.service";

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

  const title = t("admin.teacherAttendances.title");
  const description = t("admin.teacherAttendances.description");

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

export default async function TeacherAttendancesPage() {
  const settings = await appSettingsService.getSettings();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <TeacherAttendanceWorkspace workingDays={settings.workingDays} />
    </div>
  );
}

