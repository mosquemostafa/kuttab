import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ShieldCheck,
  Database,
  Languages,
  LayoutDashboard,
  Layers,
  Bell,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "landing" });

  const featureCards = [
    {
      icon: ShieldCheck,
      title: t("features.auth.title"),
      description: t("features.auth.description"),
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      icon: Database,
      title: t("features.database.title"),
      description: t("features.database.description"),
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      icon: Languages,
      title: t("features.bilingual.title"),
      description: t("features.bilingual.description"),
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      icon: LayoutDashboard,
      title: t("features.admin.title"),
      description: t("features.admin.description"),
      color: "text-violet-500 bg-violet-500/10",
    },
    {
      icon: Layers,
      title: t("features.architecture.title"),
      description: t("features.architecture.description"),
      color: "text-rose-500 bg-rose-500/10",
    },
    {
      icon: Bell,
      title: t("features.notifications.title"),
      description: t("features.notifications.description"),
      color: "text-sky-500 bg-sky-500/10",
    },
  ];

  const stackItems = [
    "Next.js 16 (App Router)",
    "React 19",
    "Better Auth",
    "PostgreSQL + Drizzle ORM",
    "Tailwind CSS 4",
    "Bilingual (next-intl)",
    "Admin Portal",
    "PWA Ready",
  ];

  return (
    <div className="min-h-screen w-full bg-background flex flex-col justify-between">
      <Navbar />

      <main className="w-full flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className="container mx-auto px-4 text-center max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/80 bg-muted/60 text-xs font-medium text-muted-foreground mb-8">
              <Sparkles className="size-3.5 text-primary" />
              <span>{t("hero.badge")}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight md:leading-tight mb-6">
              {t("hero.title")}{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {t("hero.titleHighlight")}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              {t("hero.subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 px-8 text-base font-semibold rounded-xl"
              >
                <Link href="/auth/register" prefetch={false}>
                  {t("hero.ctaPrimary")}
                  <ArrowRight className="size-4 ms-2 rtl:rotate-180" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base font-semibold rounded-xl"
              >
                <Link href="/auth/login" prefetch={false}>
                  {t("hero.ctaSecondary")}
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-12 px-8 text-base font-semibold rounded-xl"
              >
                <Link href="/dashboard" prefetch={false}>
                  {t("hero.ctaDashboard")}
                </Link>
              </Button>
            </div>

            {/* Tech Stack Pills */}
            <div className="mt-14 pt-10 border-t border-border/40">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Core Foundation
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {stackItems.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-muted/50 border border-border/60 text-foreground/80"
                  >
                    <CheckCircle2 className="size-3 text-primary" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="py-20 md:py-28 bg-muted/20 border-y border-border/40"
        >
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                {t("features.title")}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("features.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featureCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    className="group relative rounded-2xl border border-border/60 bg-card p-6 shadow-xs hover:border-border hover:shadow-md transition-all duration-200"
                  >
                    <div
                      className={`size-11 rounded-xl flex items-center justify-center mb-5 ${card.color}`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">
                      {card.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-muted/40 p-8 sm:p-12 md:p-16 text-center shadow-xs">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
                {t("cta.title")}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8">
                {t("cta.subtitle")}
              </p>
              <Button
                asChild
                size="lg"
                className="h-12 px-8 text-base font-semibold rounded-xl"
              >
                <Link href="/auth/register" prefetch={false}>
                  {t("cta.button")}
                  <ArrowRight className="size-4 ms-2 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
