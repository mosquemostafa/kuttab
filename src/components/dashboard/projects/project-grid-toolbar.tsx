"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ProjectGridToolbarProps = {
  searchInput: string;
  onSearchChange: (value: string) => void;
  labels: {
    searchPlaceholder: string;
  };
  className?: string;
};

export function ProjectGridToolbar({
  searchInput,
  onSearchChange,
  labels,
  className,
}: ProjectGridToolbarProps) {
  return (
    <div className={cn("w-full max-w-xl", className)}>
      <Label htmlFor="project-search" className="sr-only">
        {labels.searchPlaceholder}
      </Label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id="project-search"
          type="search"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={labels.searchPlaceholder}
          autoComplete="off"
          className={cn(
            "h-11 w-full rounded-xl border-border/60 bg-muted/40 ps-10 shadow-none",
            "placeholder:text-muted-foreground/80",
            "transition-[color,box-shadow,background-color]",
            "focus-visible:border-ring focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring/40",
          )}
        />
      </div>
    </div>
  );
}
