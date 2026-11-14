import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import Navbar from "@/components/landing/navbar";
import { BlogPostView } from "@/components/blogs/blog-post-view";
import { JsonLd } from "@/components/seo/json-ld";
import { fetchBlogAuthorDisplay } from "@/lib/blogs/fetch-blog-author";
import { fetchPublishedBlogBySlug } from "@/lib/blogs/fetch-public-blogs";
import { buildBlogPostMetadata } from "@/lib/blogs/blog-post-metadata";
import { BLOG_READER_PATHS } from "@/lib/blogs/blog-reader-paths";
import { buildBlogPostJsonLd } from "@/lib/seo/blog-post-json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({
    locale,
    namespace: "metadata",
  });
  const appName = t("title");
  const blog = await fetchPublishedBlogBySlug(slug);

  if (!blog) {
    const title = `${appName} | ${t("blogs.notFoundTitle")}`;
    const description = t("blogs.notFoundDescription");

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

  return buildBlogPostMetadata({
    locale,
    slug,
    blog,
    variant: "public",
  });
}

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const blog = await fetchPublishedBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  const author = await fetchBlogAuthorDisplay(blog.authorId);
  const postJsonLd = buildBlogPostJsonLd({
    locale,
    slug,
    blog,
    author,
  });

  return (
    <div className="min-h-screen w-full bg-background">
      <JsonLd data={postJsonLd} />
      <Navbar />
      <BlogPostView
        locale={locale}
        blog={blog}
        basePath={BLOG_READER_PATHS.public}
        authorOverride={author}
        commentsMode="teaser"
      />
    </div>
  );
}
