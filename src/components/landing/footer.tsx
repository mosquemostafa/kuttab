"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NewsletterSignup } from "@/components/landing/newsletter-signup";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/landing/logo";

export function Footer() {
  const t = useTranslations("landing");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 py-14 md:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link
              href="/"
              prefetch={false}
              className="mb-4 flex items-center gap-2"
            >
              <Logo />
              <span className="text-lg font-bold">{t("footer.brand")}</span>
            </Link>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground leading-relaxed">
              {t("footer.brandDescription")}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">
              {t("footer.company.title")}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/#features"
                  prefetch={false}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("footer.product.features")}
                </Link>
              </li>
              <li>
                <Link
                  href="/blogs"
                  prefetch={false}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("footer.company.blog")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  prefetch={false}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("footer.company.contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">
              {t("footer.legal.title")}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/privacy"
                  prefetch={false}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("footer.legal.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  prefetch={false}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("footer.legal.terms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 mb-8">
          <NewsletterSignup />
        </div>

        <Separator className="mb-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>{t("footer.copyright", { year: currentYear })}</p>
          <div className="flex gap-1 items-center">
            <span>{t("footer.madeWith")}</span>
            <span className="text-primary font-medium">
              Next.js & Better Auth
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
