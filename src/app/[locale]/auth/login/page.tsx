import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/server/lib/auth";
import { getDashboardPathForRole } from "@/shared/enums/user-role.enum";
import LoginClientPage from "./login-client";

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

  const title = t("auth.login.title");
  const description = t("auth.login.description");

  return {
    title,
    description,
    keywords: ["login", "authentication", "Next.js", "security"],
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

export default async function LoginPage({
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

  return <LoginClientPage />;
}
