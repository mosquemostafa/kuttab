"use client";

import useSWR from "swr";

import { apiClient } from "@/lib/api/api-client";
import { NewsletterCampaignForm } from "@/components/content/newsletter-campaign-form";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";

export function NewsletterCampaignDetailPage({
  campaignId,
  deliveryEnabled,
}: {
  campaignId: string;
  deliveryEnabled: boolean;
}) {
  const t = useTranslations("contentNewsletter");

  const { data, error, isLoading } = useSWR(
    ["content-newsletter-campaign", campaignId] as const,
    ([, id]) => apiClient.contentNewsletter.getCampaign(id),
    { revalidateOnFocus: false, dedupingInterval: 2000 },
  );

  const campaignLabel = data ? data.subjectAr || data.subjectEn : undefined;
  useSetBreadcrumb(campaignId, campaignLabel);

  if (isLoading && !data) {
    return (
      <p className="text-muted-foreground text-sm">{t("campaigns.loading")}</p>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-destructive text-sm">{t("campaigns.notFound")}</p>
        <Button variant="outline" className="w-fit" asChild>
          <Link href="/content/newsletter">{t("campaigns.backToList")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <NewsletterCampaignForm
      mode="edit"
      campaignId={campaignId}
      deliveryEnabled={deliveryEnabled}
      initialDetail={data}
    />
  );
}
