import "server-only";

export function trimmedAppBaseUrl(appUrl: string): string {
  return appUrl.replace(/\/$/, "");
}

export function organizationNode(appUrl: string): Record<string, unknown> {
  const base = trimmedAppBaseUrl(appUrl);
  return {
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: "SaaS Starter",
    url: base,
    logo: {
      "@type": "ImageObject",
      url: `${base}/og-image.png`,
    },
  };
}

export function websiteNode(options: {
  appUrl: string;
  locale: string;
  name: string;
  description: string;
}): Record<string, unknown> {
  const base = trimmedAppBaseUrl(options.appUrl);
  const localeUrl = `${base}/${options.locale}`;
  return {
    "@type": "WebSite",
    "@id": `${localeUrl}/#website`,
    url: localeUrl,
    name: options.name,
    description: options.description,
    inLanguage: options.locale,
    publisher: { "@id": `${base}/#organization` },
  };
}

export function softwareApplicationNode(options: {
  appUrl: string;
  locale: string;
  name?: string;
  description: string;
}): Record<string, unknown> {
  const base = trimmedAppBaseUrl(options.appUrl);
  const localeUrl = `${base}/${options.locale}`;
  return {
    "@type": "SoftwareApplication",
    "@id": `${localeUrl}/#software`,
    name: options.name ?? "SaaS Starter",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    url: localeUrl,
    description: options.description,
    inLanguage: options.locale,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: { "@id": `${base}/#organization` },
  };
}
