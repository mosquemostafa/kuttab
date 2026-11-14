"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";

import type { AnnouncementDTO } from "@/shared/types/announcement.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AnnouncementCarouselModalProps = {
  announcements: AnnouncementDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
};

export function AnnouncementCarouselModal({
  announcements,
  open,
  onOpenChange,
  onClose,
}: AnnouncementCarouselModalProps) {
  const locale = useLocale();
  const t = useTranslations("announcements");
  const [currentIndex, setCurrentIndex] = useState(0);

  const total = announcements.length;
  const hasCarouselControls = total > 1;
  const isRtl = /^(ar|fa|he|ur)(-|$)/i.test(locale);
  const isArabicLocale = /^ar(-|$)/i.test(locale);
  const current = useMemo(
    () => announcements[currentIndex] ?? null,
    [announcements, currentIndex],
  );

  useEffect(() => {
    if (!open) {
      setCurrentIndex(0);
      return;
    }

    setCurrentIndex((value) => Math.min(value, Math.max(total - 1, 0)));
  }, [open, total]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const goPrev = () => {
      setCurrentIndex((value) => Math.max(0, value - 1));
    };

    const goNext = () => {
      setCurrentIndex((value) => Math.min(total - 1, value + 1));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        if (!hasCarouselControls) {
          return;
        }

        if (isRtl) {
          goNext();
          return;
        }

        goPrev();
      }

      if (event.key === "ArrowRight") {
        if (!hasCarouselControls) {
          return;
        }

        if (isRtl) {
          goPrev();
          return;
        }

        goNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasCarouselControls, isRtl, onClose, onOpenChange, open, total]);

  if (!open || !current) {
    return null;
  }

  const currentTitle = isArabicLocale ? current.titleAr : current.titleEn;
  const currentContent = isArabicLocale ? current.contentAr : current.contentEn;
  const direction = isRtl ? "rtl" : "ltr";
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < total - 1;
  const isLastSlide = currentIndex === total - 1;
  const handlePrev = () => {
    setCurrentIndex((value) => Math.max(0, value - 1));
  };
  const handleNext = () => {
    setCurrentIndex((value) => Math.min(total - 1, value + 1));
  };

  const handleClose = () => {
    onOpenChange(false);
    onClose();
  };

  const getAnnouncementTypeLabel = (value: string) => {
    switch (value) {
      case "feature":
        return t("types.feature");
      case "improvement":
        return t("types.improvement");
      case "fix":
        return t("types.fix");
      case "maintenance":
        return t("types.maintenance");
      case "alert":
        return t("types.alert");
      case "promotion":
        return t("types.promotion");
      default:
        return t("types.feature");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-linear-to-b from-black/70 via-black/60 to-black/80 px-4 py-8 backdrop-blur-sm"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("modal.title")}
        dir={direction}
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-primary/20 bg-background/95 shadow-2xl"
      >
        <div className="pointer-events-none absolute -top-20 inset-e-0 size-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -inset-s-8 size-56 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative p-6 md:p-8">
          <div className="flex items-start justify-between gap-3">
            <div className="sr-only">{t("modal.title")}</div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleClose}
              className="rounded-full cursor-pointer border border-border/80 bg-background/90 text-foreground hover:bg-muted"
              aria-label={t("modal.close")}
            >
              <X />
            </Button>
          </div>

          <div className="mt-6 rounded-2xl border bg-card/70 p-4 shadow-sm md:p-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {getAnnouncementTypeLabel(current.type)}
                </Badge>
                <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                  {format(new Date(current.publishedAt), "MMM d, yyyy h:mm a")}
                </span>
              </div>

              <h2 className="text-balance text-2xl font-semibold leading-tight md:text-3xl">
                {currentTitle}
              </h2>
            </div>

            <div className="mt-4 max-h-[45vh] overflow-y-auto">
              <p className="whitespace-pre-wrap text-[15px] leading-7 text-foreground/90 md:text-base">
                {currentContent}
              </p>
            </div>

            {hasCarouselControls ? (
              <div
                className={cn(
                  "mt-5 flex flex-col gap-4 md:items-center md:justify-between",
                  isRtl ? "md:flex-row-reverse" : "md:flex-row",
                )}
              >
                <div
                  className="flex items-center justify-center gap-2"
                  aria-label={t("modal.title")}
                >
                  {announcements.map((announcement, index) => (
                    <button
                      key={announcement.id}
                      type="button"
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        "h-2.5 rounded-full transition-all duration-200",
                        index === currentIndex
                          ? "w-7 bg-primary"
                          : "w-2.5 bg-muted-foreground/35 hover:bg-muted-foreground/60",
                      )}
                      aria-label={t("modal.progress", {
                        current: index + 1,
                        total,
                      })}
                      aria-current={index === currentIndex ? "true" : undefined}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={!canGoPrev}
                    className="rounded-full"
                    aria-label={t("modal.previous")}
                  >
                    {isRtl ? (
                      <ChevronRight data-icon="inline-start" />
                    ) : (
                      <ChevronLeft data-icon="inline-start" />
                    )}
                    {t("modal.previous")}
                  </Button>

                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={isLastSlide ? handleClose : handleNext}
                    disabled={isLastSlide ? false : !canGoNext}
                    className="rounded-full"
                    aria-label={
                      isLastSlide ? t("modal.close") : t("modal.next")
                    }
                  >
                    {isLastSlide ? t("modal.close") : t("modal.next")}
                    {isLastSlide ? (
                      <X data-icon="inline-end" />
                    ) : (
                      <>
                        {isRtl ? (
                          <ChevronLeft data-icon="inline-end" />
                        ) : (
                          <ChevronRight data-icon="inline-end" />
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
