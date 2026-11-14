import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AssetsLibrarySection } from "@/components/content/assets-library-section";

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

  const title = t("content.assets.title");
  const description = t("content.assets.description");

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

export default async function ContentAssetsPage() {
  return (
    <section className="container mx-auto max-w-6xl px-4 py-8">
      <AssetsLibrarySection />
    </section>
  );
}
