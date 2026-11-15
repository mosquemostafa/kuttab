import NextTopLoader from "nextjs-toploader";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Inter, Tajawal, Amiri } from "next/font/google";

import { routing } from "@/i18n/routing";
import { DirectionProvider } from "@/components/ui/direction";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import { ThemedToaster } from "@/components/themed-toaster";
import { env } from "@/server/lib/env";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  weight: ["400", "500", "700", "800"],
  subsets: ["arabic"],
  display: "swap",
  preload: false,
});

const amiri = Amiri({
  variable: "--font-amiri",
  weight: ["400", "700"],
  subsets: ["arabic"],
  display: "swap",
  preload: false,
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const messages = await getMessages({ locale });
  const rootKeywords = (
    messages as { metadata?: { keywords?: Record<string, string> } }
  ).metadata?.keywords;
  const keywords =
    rootKeywords && typeof rootKeywords === "object"
      ? Object.values(rootKeywords).filter(
          (k): k is string => typeof k === "string" && k.trim() !== "",
        )
      : undefined;

  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const localeUrl = `${appUrl}/${locale}`;

  const alternates: Record<string, string> = routing.locales.reduce<
    Record<string, string>
  >((acc, currentLocale) => {
    acc[currentLocale] = `${appUrl}/${currentLocale}`;
    return acc;
  }, {});
  alternates["x-default"] = `${appUrl}/`;

  return {
    metadataBase: new URL(appUrl),
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: t("title"),
    },
    other: {
      "mobile-web-app-capable": "yes",
    },
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: {
      canonical: localeUrl,
      languages: alternates,
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: localeUrl,
      type: "website",
      siteName: t("title"),
      locale,
      images: [
        {
          url: `${appUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: t("title"),
        },
      ],
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon-32x32.png",
      apple: "/apple-touch-icon.png",
      other: [
        {
          rel: "apple-touch-icon",
          url: "/apple-touch-icon.png",
        },
        {
          rel: "apple-touch-icon-precomposed",
          url: "/apple-touch-icon-precomposed.png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: appUrl,
      title: t("title"),
      description: t("description"),
      images: [`${appUrl}/og-image.png`],
      domain: appUrl.replace(/^https?:\/\//, ""),
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const direction = locale === "ar" ? "rtl" : "ltr";
  const messages = await getMessages({ locale });

  return (
    <html
      lang={locale}
      dir={direction}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body
        className={`${inter.variable} ${tajawal.variable} ${amiri.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="theme"
        >
          <DirectionProvider direction={direction}>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <NextTopLoader color="#059669" showSpinner={false} />
              <Providers>{children}</Providers>
              <ThemedToaster />
            </NextIntlClientProvider>
          </DirectionProvider>
        </ThemeProvider>
        {env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
          <GoogleAnalytics gaId={env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        ) : null}
      </body>
    </html>
  );
}
