import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/server/lib/auth";
import { getDashboardPathForRole } from "@/shared/enums/user-role.enum";
import { appSettingsService } from "@/server/modules/app-settings/app-settings.service";
import RegisterClientPage from "./register-client";

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

  const title = t("auth.register.title");
  const description = t("auth.register.description");

  return {
    title,
    description,
    keywords: ["register", "signup", "authentication", "web app"],
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

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session) {
    redirect({ href: getDashboardPathForRole(session.user.role), locale });
  }

  const settings = await appSettingsService.getSettings();
  if (!settings.allowSelfRegistration) {
    redirect({ href: "/auth/login", locale });
  }

  return <RegisterClientPage />;
}
