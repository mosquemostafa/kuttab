import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export const dynamic = "force-static";
import Navbar from "@/components/landing/navbar";

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

  const title = t("dashboard.settingsNotificationsHelp.title");
  const description = t("dashboard.settingsNotificationsHelp.description");

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

export default async function NotificationsHelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: "settings.notifications.helpPage",
  });

  const sections = [
    { key: "chrome", title: t("chrome.title"), body: t("chrome.body") },
    { key: "edge", title: t("edge.title"), body: t("edge.body") },
    { key: "firefox", title: t("firefox.title"), body: t("firefox.body") },
    { key: "safari", title: t("safari.title"), body: t("safari.body") },
    {
      key: "mobile",
      title: t("mobile.title"),
      body: t("mobile.body"),
      note: t("mobile.chromeAppNote"),
    },
  ] as const;

  return (
    <div className="container mx-auto  px-4 py-8">
      <Navbar />
      <Link
        href="/dashboard/settings"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t("back")}
      </Link>

      <article className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t("lead")}
        </p>

        <div className="mt-8 space-y-8 border-t border-border pt-8">
          {sections.map((section) => (
            <section key={section.key}>
              <h2 className="text-base font-semibold text-foreground">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {section.body}
              </p>
              {section.key === "mobile" && section.note ? (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {section.note}
                </p>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
