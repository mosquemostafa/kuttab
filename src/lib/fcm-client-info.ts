import type { FcmSource } from "@/shared/types/fcm.types";

export type FcmClientInfo = {
  os: string;
  device: string;
  source: FcmSource;
  userAgent: string;
};

type IOSNavigator = Navigator & {
  standalone?: boolean;
};

function detectSource(): FcmSource {
  if (typeof window === "undefined") return "browser";

  const isStandaloneDisplayMode =
    window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;

  const isIOSStandalone =
    (window.navigator as IOSNavigator).standalone === true;

  const isAndroidChromePWA = document.referrer.includes("android-app://");

  return isStandaloneDisplayMode || isIOSStandalone || isAndroidChromePWA
    ? "pwa"
    : "browser";
}

function detectOs(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (ua.includes("android")) return "android";
  if (ua.includes("cros")) return "chromeos";
  if (ua.includes("windows")) return "windows";
  if (ua.includes("mac os x") || ua.includes("macintosh")) return "macos";
  if (ua.includes("linux")) return "linux";
  return "unknown";
}

function detectDevice(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android/.test(ua)) return "mobile";
  return "desktop";
}

export function getFcmClientInfo(): FcmClientInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      os: "unknown",
      device: "desktop",
      source: "browser",
      userAgent: "unknown",
    };
  }

  const userAgent = navigator.userAgent || "unknown";

  return {
    os: detectOs(userAgent),
    device: detectDevice(userAgent),
    source: detectSource(),
    userAgent,
  };
}
