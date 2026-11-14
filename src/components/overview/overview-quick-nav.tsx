"use client";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type QuickActionItem = {
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
};

type OverviewQuickNavProps = {
  items: QuickActionItem[];
  className?: string;
};

export function OverviewQuickNav({ items, className }: OverviewQuickNavProps) {
  return (
    <div
      className={cn(
        "md:hidden -mx-4 flex gap-3 overflow-x-auto pb-2 ps-4 pe-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:gap-4 sm:ps-0 sm:pe-0 sm:overflow-x-visible sm:flex-wrap",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group flex w-15 shrink-0 flex-col items-center gap-1.5 text-center sm:w-20 sm:gap-2"
            aria-label={item.title}
          >
            <span className="flex h-13 w-13 items-center justify-center rounded-full border bg-card text-card-foreground shadow-sm transition-transform duration-200 group-hover:shadow-md sm:h-16 sm:w-16">
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
            </span>
            <span className="text-[11px] font-medium leading-tight text-muted-foreground sm:text-xs">
              {item.title}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
