import "server-only";

import {
  organizationNode,
  softwareApplicationNode,
  trimmedAppBaseUrl,
  websiteNode,
} from "@/lib/seo/schema-org-base";

export function buildHomePageJsonLd(options: {
  appUrl: string;
  locale: string;
  siteName: string;
  siteDescription: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(options.appUrl),
      websiteNode({
        appUrl: options.appUrl,
        locale: options.locale,
        name: options.siteName,
        description: options.siteDescription,
      }),
      softwareApplicationNode({
        appUrl: options.appUrl,
        locale: options.locale,
        name: options.siteName,
        description: options.siteDescription,
      }),
    ],
  };
}

export function buildBlogsIndexJsonLd(options: {
  appUrl: string;
  locale: string;
  siteName: string;
  siteDescription: string;
  listTitle: string;
  listDescription: string;
}): Record<string, unknown> {
  const base = trimmedAppBaseUrl(options.appUrl);
  const blogsUrl = `${base}/${options.locale}/blogs`;
  const webSite = websiteNode({
    appUrl: options.appUrl,
    locale: options.locale,
    name: options.siteName,
    description: options.siteDescription,
  });

  const collectionPage: Record<string, unknown> = {
    "@type": "CollectionPage",
    "@id": `${blogsUrl}#webpage`,
    url: blogsUrl,
    name: options.listTitle,
    description: options.listDescription,
    inLanguage: options.locale,
    isPartOf: { "@id": `${base}/${options.locale}/#website` },
    publisher: { "@id": `${base}/#organization` },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(options.appUrl), webSite, collectionPage],
  };
}
