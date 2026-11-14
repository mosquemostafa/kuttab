import { getTranslations } from "next-intl/server";

import { NewsletterUnsubscribeClient } from "@/app/[locale]/newsletter/unsubscribe/unsubscribe-client";
import { newsletterService } from "@/server/modules/newsletter/newsletter.service";

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token?.trim() ?? "";
  const t = await getTranslations("newsletter.unsubscribe");

  if (!token) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16">
        <p className="text-muted-foreground text-center">{t("missingToken")}</p>
      </div>
    );
  }

  const preview =
    await newsletterService.getSubscriberForUnsubscribeConfirm(token);

  if (!preview) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16">
        <p className="text-muted-foreground text-center">{t("invalidToken")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <NewsletterUnsubscribeClient token={token} preview={preview} />
    </div>
  );
}
