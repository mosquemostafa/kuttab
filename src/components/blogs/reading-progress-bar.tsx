"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type ReadingProgressBarProps = {
  dir: "ltr" | "rtl";
};

export function ReadingProgressBar({ dir }: ReadingProgressBarProps) {
  const t = useTranslations("blogs");

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-100 h-2 border-t-2 border-border bg-muted shadow-[0_-3px_14px_-2px_rgba(0,0,0,0.12)] dark:shadow-[0_-3px_14px_-2px_rgba(0,0,0,0.35)]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={t("public.readingProgressAria")}
    >
      <div
        className={cn(
          "h-full w-full bg-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]",
          dir === "rtl" ? "origin-right" : "origin-left",
        )}
        style={{
          animationName: "reading-progress",
          animationTimeline: "scroll(root)",
          animationDuration: "1ms",
          animationTimingFunction: "linear",
          animationFillMode: "both",
        }}
      />
      <style>{`
        @keyframes reading-progress {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
      `}</style>
    </div>
  );
}
