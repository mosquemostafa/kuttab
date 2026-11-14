import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { NewsletterPanel } from "@/components/content/newsletter-panel";
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

  const title = t("content.newsletter.title");
  const description = t("content.newsletter.description");

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function ContentNewsletterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contentNewsletter" });

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm">
            {t("campaigns.loading")}
          </p>
        }
      >
        <NewsletterPanel deliveryEnabled={newsletterDeliveryEnabled} />
      </Suspense>
    </div>
  );
}
