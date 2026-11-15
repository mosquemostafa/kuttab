import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { DashboardNewsletterChannelSubscribeCta } from "@/components/dashboard/dashboard-newsletter-channel-subscribe-cta";
import { BreadcrumbOverride } from "@/components/dashboard/breadcrumb-context";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { Link } from "@/i18n/navigation";
import {
  fetchDashboardSettingsBootstrap,
  type DashboardSettingsBootstrap,
} from "@/lib/api/api-server";
import { NotFoundException } from "@/server/exceptions/exceptions";
import { newsletterService } from "@/server/modules/newsletter/newsletter.service";

const emptyDashboardSettings: DashboardSettingsBootstrap = {
  name: "",
  email: "",
  phone: "",
  image: null,
  hasPasswordLogin: false,
  avatarR2UploadEnabled: false,
};

async function getDashboardSettingsBootstrap(): Promise<DashboardSettingsBootstrap> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) {
    return emptyDashboardSettings;
  }

  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const cookie = requestHeaders.get("cookie") ?? "";

  return fetchDashboardSettingsBootstrap({ protocol, host, cookie });
}

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

  let title = t("dashboard.newsletterChannel.article.title");
  let description = t("dashboard.newsletterChannel.article.description");

  try {
    const art = await newsletterService.getWebsitePublicArticleBySlug(slug);
    const headline = locale === "ar" ? art.subjectAr : art.subjectEn;
    const brand = locale === "ar" ? "معهد المصطفى" : "Almostafa";
    title = `${headline} | ${brand}`;
    const ex = locale === "ar" ? art.excerptAr : art.excerptEn;
    if (ex?.trim()) {
      description = ex.trim().slice(0, 160);
    }
  } catch {
    /* keep generic */
  }

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function DashboardNewsletterArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("newsletterChannel.list");

  let article;
  try {
    article = await newsletterService.getWebsitePublicArticleBySlug(slug);
  } catch (e) {
    if (e instanceof NotFoundException) {
      notFound();
    }
    throw e;
  }

  const contentLocale = locale === "ar" ? "ar" : "en";
  const subject =
    contentLocale === "ar" ? article.subjectAr : article.subjectEn;
  const excerpt =
    contentLocale === "ar" ? article.excerptAr : article.excerptEn;
  const bodyMarkdown = contentLocale === "ar" ? article.bodyAr : article.bodyEn;
  const dashboardSettings = await getDashboardSettingsBootstrap();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <BreadcrumbOverride segment={slug} label={subject} />
      <div className="mb-6">
        <ButtonLinkBack label={t("backToList")} />
      </div>

      <article className="space-y-6">
        <header className="space-y-3">
          <h1
            className="text-2xl font-semibold tracking-tight"
            dir={contentLocale === "ar" ? "rtl" : "ltr"}
          >
            {subject}
          </h1>
          {excerpt ? (
            <p
              className="text-muted-foreground text-base leading-relaxed"
              dir={contentLocale === "ar" ? "rtl" : "ltr"}
            >
              {excerpt}
            </p>
          ) : null}
        </header>

        {article.coverImageUrl ? (
          <div className="overflow-hidden rounded-xl border border-border">
            {/* External cover URLs (e.g. CDN); avoid next/image remote config. */}
            <img
              src={article.coverImageUrl}
              alt=""
              className="max-h-[min(420px,50vh)] w-full object-cover"
            />
          </div>
        ) : null}

        <div
          className="max-w-none"
          dir={contentLocale === "ar" ? "rtl" : "ltr"}
        >
          <RichTextDisplay
            markdown={bodyMarkdown}
            lang={contentLocale}
            dir={contentLocale === "ar" ? "rtl" : "ltr"}
          />
        </div>
      </article>

      <DashboardNewsletterChannelSubscribeCta
        accountEmail={dashboardSettings.email}
        articleFooter
        compact
      />
    </div>
  );
}

function ButtonLinkBack({ label }: { label: string }) {
  return (
    <Link
      href="/dashboard/newsletter"
      className="text-primary text-sm font-medium hover:underline"
    >
      {label}
    </Link>
  );
}
