import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { NewsletterCampaignForm } from "@/components/content/newsletter-campaign-form";
import { newsletterDeliveryEnabled } from "@/server/lib/env";

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

  const title = t("content.newsletterCreate.title");
  const description = t("content.newsletterCreate.description");

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function ContentNewsletterCreatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contentNewsletter" });

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("campaigns.formCreateTitle")}
      </h1>
      <NewsletterCampaignForm
        mode="create"
        deliveryEnabled={newsletterDeliveryEnabled}
      />
    </div>
  );
}
