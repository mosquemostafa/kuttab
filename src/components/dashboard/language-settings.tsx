"use client";

import { useTransition } from "react";
import { Check, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";

const LANGUAGE_OPTIONS = ["ar", "en"] as const;

type LanguageOption = (typeof LANGUAGE_OPTIONS)[number];

const LANGUAGE_ICONS: Record<LanguageOption, string> = {
  ar: "أ",
  en: "A",
};

function getDirection(locale: LanguageOption): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export default function LanguageSettings() {
  const t = useTranslations("settings.language");
  const optionLabels: Record<LanguageOption, string> = {
    ar: t("options.ar"),
    en: t("options.en"),
  };
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isSwitchingLocale, startTransition] = useTransition();

  const selectedLocale: LanguageOption = locale === "ar" ? "ar" : "en";

  const handleLocaleSwitch = (nextLocale: LanguageOption) => {
    if (nextLocale === selectedLocale) {
      return;
    }

    const root = document.documentElement;
    root.lang = nextLocale;
    root.dir = getDirection(nextLocale);

    startTransition(() => {
      void router.push(pathname ?? "/", { locale: nextLocale });
    });
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex min-w-0 gap-4">
        <div
          className="hidden size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary sm:flex"
          aria-hidden
        >
          <Languages className="size-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-medium">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {LANGUAGE_OPTIONS.map((option) => {
          const selected = selectedLocale === option;
          const iconLetter = LANGUAGE_ICONS[option];

          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              disabled={isSwitchingLocale}
              onClick={() => handleLocaleSwitch(option)}
              className={`rounded-lg border px-3 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-70 ${
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/70 hover:bg-gray-50 dark:hover:border-primary/70 dark:hover:bg-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className="inline-flex h-4 w-4 items-center justify-center text-xs font-semibold leading-none text-muted-foreground">
                    {iconLetter}
                  </span>
                  <span>{optionLabels[option]}</span>
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
