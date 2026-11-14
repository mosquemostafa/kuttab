"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import {
  dashboardBlogCommentsPathFromBlogReaderPath,
  sanitizeInternalCallbackPath,
} from "@/lib/auth/safe-callback-url";
import { cn } from "@/lib/utils";

export function BlogCommentsTeaser() {
  const t = useTranslations("blogs");
  const pathname = usePathname();

  const mapped = dashboardBlogCommentsPathFromBlogReaderPath(pathname);
  const callbackPath = mapped ? sanitizeInternalCallbackPath(mapped) : null;
  const loginHref = callbackPath
    ? `/auth/login?callbackUrl=${encodeURIComponent(callbackPath)}`
    : "/auth/login";

  return (
    <section
      aria-labelledby="blog-comments-teaser-heading"
      className="relative"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2
          id="blog-comments-teaser-heading"
          className="text-lg font-semibold tracking-tight md:text-xl"
        >
          {t("comments.teaser.title")}
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <Lock className="size-3.5" aria-hidden />
          {t("comments.teaser.lockedBadge")}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-foreground/10 dark:ring-foreground/5">
        {/*
          Light: foreground-tinted bars read on `card` (muted alone vanishes).
          Dark: keep soft `muted` pills — matches existing look.
        */}
        <div
          className="pointer-events-none select-none space-y-4 bg-muted/30 p-5 md:p-6 dark:bg-muted/15"
          aria-hidden
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <div
                className={cn(
                  "size-10 shrink-0 rounded-full",
                  "bg-foreground/15 dark:bg-muted",
                )}
              />
              <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                <div
                  className={cn(
                    "h-3 max-w-[40%] rounded-full",
                    "bg-foreground/16 dark:bg-muted",
                  )}
                />
                <div
                  className={cn(
                    "h-3 w-full rounded-full",
                    "bg-foreground/13 dark:bg-muted/90",
                  )}
                />
                <div
                  className={cn(
                    "h-3 w-[92%] rounded-full",
                    "bg-foreground/10 dark:bg-muted/75",
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          className="pointer-events-none absolute inset-0 backdrop-blur-[6px]"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 22%, black 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 22%, black 100%)",
          }}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-linear-to-t from-background via-background/75 to-transparent px-6 pb-8 pt-16 text-center dark:from-background/95 dark:via-background/70">
          <p className="max-w-sm text-sm font-medium text-foreground md:text-base">
            {t("comments.teaser.description")}
          </p>
          <Button asChild size="lg" className="rounded-full shadow-md">
            <Link href={loginHref}>{t("comments.teaser.signInCta")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
