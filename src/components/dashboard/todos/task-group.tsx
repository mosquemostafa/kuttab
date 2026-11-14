"use client";

import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type TaskGroupProps = {
  title: ReactNode;
  icon?: ReactNode;
  count: number;
  isOpen: boolean;
  onToggleOpen: () => void;
  className?: string;
  titleClassName?: string;
  truncateTitle?: boolean;
  children: ReactNode;
};

export function TaskGroup({
  title,
  icon,
  count,
  isOpen,
  onToggleOpen,
  className,
  titleClassName,
  truncateTitle = true,
  children,
}: TaskGroupProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <button
        type="button"
        onClick={onToggleOpen}
        className="group flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 text-start"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "text-muted-foreground transition-transform  group-hover:text-foreground group-focus-visible:text-foreground",
              !isOpen && (isRtl ? "rotate-90" : "-rotate-90"),
            )}
          >
            <ChevronDown aria-hidden="true" />
          </span>
          {icon ? <span className="shrink-0">{icon}</span> : null}
          <h3
            className={cn(
              "min-w-0 text-lg font-semibold tracking-tight sm:text-xl md:text-2xl",
              truncateTitle && "truncate",
              titleClassName,
            )}
          >
            {title}
          </h3>
          <span className="shrink-0 text-xs text-muted-foreground sm:text-sm md:text-base">
            {count}
          </span>
        </div>
      </button>

      {isOpen ? <div className="flex flex-col gap-1">{children}</div> : null}
    </section>
  );
}
