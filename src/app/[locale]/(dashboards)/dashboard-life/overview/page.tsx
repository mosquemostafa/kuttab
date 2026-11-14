import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations, getTimeZone } from "next-intl/server";

import SubDashboardOverview from "@/components/overview/sub-dashboard-overview";
import FcmOverviewBootstrap from "@/components/dashboard/fcm-overview-bootstrap";
import { getDualDate } from "@/util/hijri-date";
import { auth } from "@/server/lib/auth";
import { motivationalNotesByLocale } from "@/shared/constants/overview";

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

  const title = t("dashboardLife.overview.title");
  const description = t("dashboardLife.overview.description");

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

export default async function DashboardLifeOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const t = await getTranslations("dashboard");
  const userName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    t("overview.greeting.defaultName");
  const timeZone = await getTimeZone();
  const { gregorian: todayValue, hijri } = getDualDate(
    new Date(),
    locale,
    timeZone,
  );
  const motivationalNotes = [
    ...(motivationalNotesByLocale[locale] ?? motivationalNotesByLocale.en),
  ];

  return (
    <section className="container mx-auto max-w-6xl px-4 py-8">
      <SubDashboardOverview
        greetingLabels={{
          morning: t("overview.greeting.morning"),
          afternoon: t("overview.greeting.afternoon"),
          evening: t("overview.greeting.evening"),
        }}
        motivationalNotes={motivationalNotes}
        userImage={session?.user?.image ?? null}
        userName={userName}
        todayValue={todayValue}
        hijriValue={hijri}
      />
      <FcmOverviewBootstrap />
    </section>
  );
}
