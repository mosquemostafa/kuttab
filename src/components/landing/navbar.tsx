"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/landing/logo";
import { NavbarAuthActions } from "@/components/landing/navbar-auth-actions";
import { cn } from "@/lib/utils";

interface NavbarProps {
  checkAuth?: boolean;
}

const Navbar = ({ checkAuth }: NavbarProps = {}) => {
  const t = useTranslations();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  const shouldCheckAuth = checkAuth ?? pathname?.startsWith("/p/") ?? false;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/#features", label: t("landing.navbar.features") },
    { href: "/blogs", label: t("landing.navbar.blog") },
    { href: "/contact", label: t("landing.navbar.contact") },
  ];

  return (
    <nav
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
          <Link href="/" prefetch={false} className="flex items-center gap-2.5">
            <Logo />
            <span className="hidden truncate text-xl font-bold tracking-tight sm:inline">
              {t("header.brandTitle")}
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
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
          </div>
        </div>

        {/* Right side — mobile (clean controls: Theme, Language, Auth) */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <LanguageSwitcher />
          <NavbarAuthActions isMobile shouldCheckAuth={shouldCheckAuth} />
        </div>

        {/* Right side — desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <LanguageSwitcher />
          <NavbarAuthActions shouldCheckAuth={shouldCheckAuth} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
