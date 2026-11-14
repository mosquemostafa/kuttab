"use client";

import { useEffect, useState } from "react";
import { Check, Moon, Palette, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { useTheme } from "@/components/theme-provider";

const THEME_OPTIONS = ["light", "dark"] as const;

type ThemeOption = (typeof THEME_OPTIONS)[number];

const THEME_ICONS: Record<ThemeOption, typeof Sun> = {
  light: Sun,
  dark: Moon,
};

export default function ThemeSettings() {
  const t = useTranslations("settings.theme");
  const optionLabels: Record<ThemeOption, string> = {
    light: t("options.light"),
    dark: t("options.dark"),
  };
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex min-w-0 gap-4">
          <div
            className="hidden size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary sm:flex"
            aria-hidden
          >
            <Palette className="size-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-lg font-medium">{t("title")}</h2>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {THEME_OPTIONS.map((option) => (
            <span
              key={option}
              aria-hidden="true"
              className="h-10 rounded-lg border border-input/60 bg-background"
            />
          ))}
        </div>
      </section>
    );
  }

  const selectedTheme: ThemeOption =
    resolvedTheme === "dark" ? "dark" : "light";

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex min-w-0 gap-4">
        <div
          className="hidden size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary sm:flex"
          aria-hidden
        >
          <Palette className="size-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-medium">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {THEME_OPTIONS.map((option) => {
          const selected = selectedTheme === option;
          const Icon = THEME_ICONS[option];

          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => setTheme(option)}
              className={`rounded-lg border px-3 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/70 hover:bg-gray-50 dark:hover:border-primary/70 dark:hover:bg-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-4 w-4" />
                  {optionLabels[option]}
                </span>
                {selected ? <Check className="h-4 w-4 text-primary" /> : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
