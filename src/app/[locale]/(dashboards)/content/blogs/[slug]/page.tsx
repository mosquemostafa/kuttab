import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { BlogForm } from "@/components/content/blog-form";

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

  const title = t("content.blogs.title");
  const description = t("content.blogs.description");

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

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <section className="container mx-auto max-w-6xl px-4 py-8">
      <BlogForm mode="edit" blogSlug={slug} />
    </section>
  );
}
