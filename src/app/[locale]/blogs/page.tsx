import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import Navbar from "@/components/landing/navbar";
import { BlogListView } from "@/components/blogs/blog-list-view";
import { JsonLd } from "@/components/seo/json-ld";
import { BLOG_READER_PATHS } from "@/lib/blogs/blog-reader-paths";
import { ltrTagString } from "@/lib/tag";
import { parseBlogListPageParam } from "@/lib/blogs/fetch-public-blogs";
import { buildBlogsIndexJsonLd } from "@/lib/seo/home-page-json-ld";
import { env } from "@/server/lib/env";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tag?: string | string[] }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const rawTag = Array.isArray(sp.tag) ? sp.tag[0] : sp.tag;
  const tagFilter =
    typeof rawTag === "string" && rawTag.trim()
      ? rawTag.trim().toLowerCase()
      : undefined;

  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const canonical = new URL(`${appUrl}/${locale}/blogs`);
  if (tagFilter) canonical.searchParams.set("tag", tagFilter);

  const t = await getTranslations({
    locale,
    namespace: "metadata",
  });
  const appName = t("title");

  if (tagFilter) {
    const title = `${appName} | ${t("blogs.tagFilterTitle", { tag: ltrTagString(tagFilter) })}`;
    const description = t("blogs.tagFilterDescription");

    return {
      title,
      description,
      alternates: {
        canonical: canonical.toString(),
      },
      openGraph: {
        title,
        description,
        url: canonical.toString(),
      },
      twitter: {
        title,
        description,
      },
    };
  }

  const title = `${appName} | ${t("blogs.listTitle")}`;
  const description = t("blogs.listDescription");

  return {
    title,
    description,
    alternates: {
      canonical: canonical.toString(),
    },
    openGraph: {
      title,
      description,
      url: canonical.toString(),
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function BlogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tag?: string | string[]; page?: string | string[] }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const rawTag = Array.isArray(sp.tag) ? sp.tag[0] : sp.tag;
  const tagFilter =
    typeof rawTag === "string" && rawTag.trim()
      ? rawTag.trim().toLowerCase()
      : undefined;
  const page = parseBlogListPageParam(sp.page);

  const t = await getTranslations({
    locale,
    namespace: "metadata",
  });
  const siteName = t("title");
  const siteDescription = t("description");
  const listTitle = tagFilter
    ? `${siteName} | ${t("blogs.tagFilterTitle", { tag: ltrTagString(tagFilter) })}`
    : `${siteName} | ${t("blogs.listTitle")}`;
  const listDescription = tagFilter
    ? t("blogs.tagFilterDescription")
    : t("blogs.listDescription");

  const blogsIndexJsonLd = buildBlogsIndexJsonLd({
    appUrl: env.NEXT_PUBLIC_APP_URL,
    locale,
    siteName,
    siteDescription,
    listTitle,
    listDescription,
  });

  return (
    <div className="min-h-screen w-full bg-background">
      <JsonLd data={blogsIndexJsonLd} />
      <Navbar />
      <BlogListView
        locale={locale}
        tagFilter={tagFilter}
        basePath={BLOG_READER_PATHS.public}
        page={page}
      />
    </div>
  );
}
