import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import type { AbstractIntlMessages } from "next-intl";

const localesWithNamespaces = [
  "common",
  "legal",
  "header",
  "auth",
  "dashboard",
  "todos",
  "projects",
  "settings",
  "adminSettings",
  "adminUsers",
  "adminSegments",
  "announcements",
  "adminAnnouncements",
  "adminNotifications",
  "notifications",
  "metadata",
  "landing",
  "newsletter",
  "contentNewsletter",
  "newsletterChannel",
] as const;

async function loadMessages(locale: string): Promise<AbstractIntlMessages> {
  const messages: AbstractIntlMessages = {};

  for (const namespace of localesWithNamespaces) {
    try {
      const file = await import(`../messages/${locale}/${namespace}.json`);
      messages[namespace] = file.default ?? file;
    } catch {
      console.warn(
        `next-intl: missing "${namespace}" translation for "${locale}"`,
      );
    }
  }

  return messages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = (await requestLocale) ?? routing.defaultLocale;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
