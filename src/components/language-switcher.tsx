"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const t = useTranslations("header");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isSwitchingLocale, startTransition] = useTransition();

  const nextLocale = locale === "ar" ? "en" : "ar";
  const toggleLabel =
    locale === "ar" ? t("switchToEnglish") : t("switchToArabic");

  const handleLocaleSwitch = () => {
    const nextDirection = nextLocale === "ar" ? "rtl" : "ltr";
    const root = document.documentElement;
    root.lang = nextLocale;
    root.dir = nextDirection;

    startTransition(() => {
      void router.push(pathname ?? "/", { locale: nextLocale });
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLocaleSwitch}
      disabled={isSwitchingLocale}
      className={className ?? "h-8 w-8 p-0"}
      title={toggleLabel}
      aria-label={toggleLabel}
    >
      <Languages className="h-4 w-4" />
    </Button>
  );
}
