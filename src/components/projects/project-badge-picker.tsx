"use client";

import { useMemo, useState } from "react";
import { FolderOpen } from "lucide-react";

import { useProjectsStore } from "@/components/projects/projects-store";
import { Badge } from "@/components/ui/badge";
import { ProjectPickerDropdown } from "@/components/projects/project-picker-dropdown";
import { cn } from "@/lib/utils";
import { projectColorKeyToIconTextClass } from "@/shared/constants/color-palette";

type ProjectBadgePickerProps = {
  projectId: string | null;
  onChange: (next: string | null) => void | Promise<void>;
  noneLabel: string;
  unknownProjectLabel: string;
  ariaLabel: string;
  disabled?: boolean;
  align?: "start" | "end";
  /** Softer colors (e.g. completed task). */
  dimmed?: boolean;
  /** Task card badges (tight / responsive); note rows use comfortable. */
  size?: "compact" | "comfortable";
  className?: string;
  /** Restyles for pastel / colored backgrounds (e.g. sticky-note cards). */
  tintedSurface?: boolean;
};

export function ProjectBadgePicker({
  projectId,
  onChange,
  noneLabel,
  unknownProjectLabel,
  ariaLabel,
  disabled,
  align = "start",
  dimmed,
  size = "compact",
  className,
  tintedSurface,
}: ProjectBadgePickerProps) {
  const { getProjectById } = useProjectsStore();
  const [pending, setPending] = useState(false);

  const resolved = useMemo(
    () => (projectId ? getProjectById(projectId) : undefined),
    [getProjectById, projectId],
  );
  const displayName = resolved?.name
    ? resolved.name
    : projectId
      ? unknownProjectLabel
      : noneLabel;
  const iconTintClass = resolved
    ? projectColorKeyToIconTextClass(resolved.colorKey)
    : undefined;
  const icon = resolved?.icon ?? null;

  const isCompact = size === "compact";

  const triggerBtnClass = cn(
    "inline-flex max-w-full min-w-0 cursor-pointer items-center rounded-md font-medium outline-none transition-colors",
    tintedSurface
      ? "hover:bg-black/10 hover:text-inherit"
      : "hover:bg-muted hover:text-foreground",
    isCompact
      ? "px-1 py-0.5 text-[10px] sm:rounded-lg sm:px-2 sm:py-1 sm:text-sm"
      : "rounded-lg px-2 py-1 text-sm",
    className,
  );

  const tintBadge = tintedSurface
    ? "border-black/15 bg-white/45 text-inherit shadow-none dark:border-white/20 dark:bg-black/20"
    : null;

  const withProjectBadgeClass = cn(
    isCompact
      ? "h-4 max-w-full gap-0.5 px-1 py-0 text-[10px] leading-tight sm:h-5 sm:gap-1.5 sm:px-2 sm:text-sm sm:leading-normal"
      : "h-7 max-w-full gap-1.5 px-2 py-0 text-sm leading-normal",
    !tintedSurface && dimmed && "text-muted-foreground",
    tintedSurface && dimmed && "opacity-70",
    tintBadge,
  );

  const emptyBadgeClass = cn(
    isCompact
      ? "h-4 px-1 py-0 sm:h-5 sm:px-2 sm:text-sm"
      : "h-7 px-2 py-0 text-sm",
    !tintedSurface && "text-muted-foreground",
    tintedSurface && dimmed && "opacity-70",
    tintBadge,
  );

  const folderClass = isCompact
    ? "size-2.5 shrink-0 sm:size-3.5"
    : "size-3.5 shrink-0";

  return (
    <ProjectPickerDropdown
      value={projectId}
      onChange={async (next) => {
        setPending(true);
        try {
          await onChange(next);
        } finally {
          setPending(false);
        }
      }}
      noneLabel={noneLabel}
      ariaLabel={ariaLabel}
      align={align}
      disabled={disabled || pending}
      trigger={
        <button type="button" className={triggerBtnClass}>
          {projectId ? (
            <Badge variant="outline" className={withProjectBadgeClass}>
              <FolderOpen
                className={cn(
                  folderClass,
                  iconTintClass ?? "text-muted-foreground",
                )}
                aria-hidden
              />
              <span className="min-w-0 truncate">{displayName}</span>
              {icon ? <span className="shrink-0">{icon}</span> : null}
            </Badge>
          ) : (
            <Badge variant="outline" className={emptyBadgeClass}>
              <FolderOpen className={folderClass} aria-hidden />
            </Badge>
          )}
        </button>
      }
    />
  );
}
