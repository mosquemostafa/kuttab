"use client";

import { useEffect, useState } from "react";
import { Check, SwatchBook } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  type AccentColor,
  getAccentColorFromStorage,
  ACCENT_OPTIONS,
} from "@/components/accent-color-loader";

const ACCENT_PREVIEW_CLASSES: Record<AccentColor, string> = {
  neutral: "bg-neutral-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  red: "bg-red-500",
  purple: "bg-violet-600",
  gold: "bg-amber-500",
};

const ACCENT_HOVER_BORDER_CLASSES: Record<AccentColor, string> = {
  neutral: "hover:border-neutral-500 dark:hover:border-neutral-300",
  blue: "hover:border-blue-500 dark:hover:border-blue-400",
  green: "hover:border-green-500 dark:hover:border-green-400",
  red: "hover:border-red-500 dark:hover:border-red-400",
  purple: "hover:border-violet-600 dark:hover:border-violet-500",
  gold: "hover:border-amber-500 dark:hover:border-amber-400",
};

const STORAGE_KEY = "accentColor";

function storeAccentColor(value: AccentColor) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, value);
}

export default function AccentColorSettings() {
  const t = useTranslations("settings.accentColor");
  const optionLabels: Record<AccentColor, string> = {
    neutral: t("options.neutral"),
    blue: t("options.blue"),
    green: t("options.green"),
    red: t("options.red"),
    purple: t("options.purple"),
    gold: t("options.gold"),
  };
  const [accentColor, setAccentColor] = useState<AccentColor>("neutral");

  useEffect(() => {
    const domValue = getAccentColorFromStorage();
    setAccentColor(domValue);
  }, []);

  const handleChange = (value: AccentColor) => {
    setAccentColor(value);
    storeAccentColor(value);
    window.dispatchEvent(new CustomEvent("accent-change", { detail: value }));
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex min-w-0 gap-4">
        <div
          className="hidden size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary sm:flex"
          aria-hidden
        >
          <SwatchBook className="size-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-medium">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-6">
        {ACCENT_OPTIONS.map((option) => {
          const selected = accentColor === option;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => handleChange(option)}
              className={`rounded-lg border px-3 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selected
                  ? "border-primary bg-primary/10"
                  : `border-border ${ACCENT_HOVER_BORDER_CLASSES[option]} hover:bg-gray-50 dark:hover:bg-slate-700`
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-4 w-4 shrink-0 rounded-full border ${
                    ACCENT_PREVIEW_CLASSES[option]
                  }`}
                />
                <span className="capitalize text-sm font-medium">
                  {optionLabels[option]}
                </span>
                {selected && <Check className="h-4 w-4 text-primary" />}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
