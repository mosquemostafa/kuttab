"use client";

import { useEffect } from "react";

export const ACCENT_OPTIONS = [
  "neutral",
  "blue",
  "green",
  "red",
  "purple",
  "gold",
] as const;
export type AccentColor = (typeof ACCENT_OPTIONS)[number];
const STORAGE_KEY = "accentColor";

export function getAccentColorFromStorage(): AccentColor {
  if (typeof window === "undefined") {
    return "neutral";
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw || !ACCENT_OPTIONS.includes(raw as AccentColor)) {
    return "neutral";
  }

  return raw as AccentColor;
}

export default function DashboardAccentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initial load
    const initialAccent = getAccentColorFromStorage();
    document.documentElement.setAttribute("data-accent", initialAccent);

    // Listen for changes
    const handleAccentChange = (e: Event) => {
      const customEvent = e as CustomEvent<AccentColor>;
      document.documentElement.setAttribute("data-accent", customEvent.detail);
    };

    window.addEventListener("accent-change", handleAccentChange);
    return () => {
      window.removeEventListener("accent-change", handleAccentChange);
      document.documentElement.removeAttribute("data-accent");
    };
  }, []);

  return <>{children}</>;
}
