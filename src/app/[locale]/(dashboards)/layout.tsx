import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { privateSurfaceRobots } from "@/lib/seo/private-surface-robots";

export function generateMetadata(): Metadata {
  return { robots: privateSurfaceRobots };
}

export default async function DashboardsLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <div lang={locale} dir={direction}>
      {children}
    </div>
  );
}
