import { CHROME_EXTENSION_STORE_URL } from "@/lib/browser-extension";

export type PlatformKey = "ios" | "android" | "extension" | "web";

interface PlatformLinks {
  appStore: string;
  googlePlay: string;
  browserExtension: string;
  chromeExtension: string;
  webApp: string;
}

/**
 * Single source of truth for all cross-platform links.
 * Used across the landing page Hero Ribbon, dedicated pages, and CTAs.
 */
export const PLATFORM_LINKS: PlatformLinks = {
  appStore: "/ios",
  googlePlay: "/android",
  browserExtension: "/browser-extension",
  chromeExtension: CHROME_EXTENSION_STORE_URL,
  webApp: "/auth/register",
};
