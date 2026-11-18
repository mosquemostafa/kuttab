"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const t = useTranslations();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [{ href: "/contact", label: t("landing.navbar.contact") }];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-border/80 bg-background/85 backdrop-blur-md shadow-xs"
          : "border-transparent bg-background/60 backdrop-blur-xs",
      )}
    >
      <div className="container relative mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            prefetch={false}
            className="group flex items-center gap-3"
          >
            <Logo size="md" />
            <div className="flex flex-col">
              <span className="hidden truncate text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors sm:inline">
                {t("header.brandTitle")}
              </span>
              <span className="hidden text-[10px] text-muted-foreground font-medium leading-none sm:inline">
                {t("dashboard.shell.brandSubtitle")}
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className="px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          <Button asChild size="sm" variant="outline">
            <Link href="/auth/login" prefetch={false}>
              {t("header.signIn")}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
