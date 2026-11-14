import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SupportTicketsManagementTable } from "@/components/support/support-tickets-management-table";

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

  const title = t("support.tickets.title");
  const description = t("support.tickets.description");

  return {
    title,
    description,
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

export default async function SupportTicketsPage() {
  return (
    <section className="container mx-auto max-w-5xl px-4 py-8">
      <SupportTicketsManagementTable />
    </section>
  );
}
