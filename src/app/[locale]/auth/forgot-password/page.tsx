import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ForgotPasswordView from "./forgot-password";

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

  const title = t("auth.forgotPassword.title");
  const description = t("auth.forgotPassword.description");

  return {
    title,
    description,
    keywords: ["forgot password", "reset password", "authentication"],
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

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
