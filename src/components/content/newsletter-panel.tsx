"use client";

import { useTranslations } from "next-intl";

import { NewsletterCampaignsTable } from "@/components/content/newsletter-campaigns-table";
import { NewsletterSubscribersTable } from "@/components/content/newsletter-subscribers-table";

export function NewsletterPanel({
  deliveryEnabled,
}: {
  deliveryEnabled: boolean;
}) {
  const t = useTranslations("contentNewsletter");

  return (
    <div className="flex flex-col gap-6">
      {!deliveryEnabled ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
          {t("disabled")}
        </p>
      ) : null}
      <NewsletterCampaignsTable deliveryEnabled={deliveryEnabled} />
      <NewsletterSubscribersTable />
    </div>
  );
}
