import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { NewsletterCampaignDetailPage } from "@/components/content/newsletter-campaign-detail-page";
import { newsletterDeliveryEnabled } from "@/server/lib/env";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "metadata",
  });

  const title = t("content.newsletterCampaign.title");
  const description = t("content.newsletterCampaign.description");

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function ContentNewsletterCampaignPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "contentNewsletter" });

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm">
            {t("campaigns.loading")}
          </p>
        }
      >
        <NewsletterCampaignDetailPage
          campaignId={id}
          deliveryEnabled={newsletterDeliveryEnabled}
        />
      </Suspense>
    </div>
  );
}
