"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";

export function PublicFooter() {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <span className="text-base font-semibold">
              {t("header.brandTitle")}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/blogs"
              prefetch={false}
              className="hover:text-foreground transition-colors"
            >
              {t("landing.navbar.blog")}
            </Link>
            <Link
              href="/contact"
              prefetch={false}
              className="hover:text-foreground transition-colors"
            >
              {t("landing.navbar.contact")}
            </Link>
            <Link
              href="/privacy"
              prefetch={false}
              className="hover:text-foreground transition-colors"
            >
              {t("legal.privacy.title")}
            </Link>
            <Link
              href="/terms"
              prefetch={false}
              className="hover:text-foreground transition-colors"
            >
              {t("legal.terms.title")}
            </Link>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>
            © {currentYear} {t("header.brandTitle")}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
