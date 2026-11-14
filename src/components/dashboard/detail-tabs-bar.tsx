"use client";

import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export type NavTabItem<T extends string = string> = {
  key: T;
  label: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  count?: number;
};

export type DetailTabsBarProps<T extends string = string> = {
  tabs: NavTabItem<T>[];
  activeTab: T;
  onTabChange: (key: T) => void;
  ariaLabel?: string;
  className?: string;
};

export function DetailTabsBar<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel,
  className,
}: DetailTabsBarProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex min-w-full sm:min-w-0 items-center gap-1 rounded-xl border border-border/50 bg-muted/60 p-1",
        className,
      )}
    >
      {tabs.map(({ key, label, icon: Icon, count }) => {
        const isSelected = activeTab === key;

        return (
          <button
            key={key}
            type="button"
            role="tab"
            id={`tab-${key}`}
            aria-selected={isSelected}
            aria-controls={`panel-${key}`}
            onClick={() => onTabChange(key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:bg-background/40 hover:text-foreground",
            )}
          >
            {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums leading-none",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
