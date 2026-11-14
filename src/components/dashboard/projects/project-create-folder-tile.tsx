"use client";

import { Plus } from "lucide-react";

import { FinderFolderGraphic } from "@/components/dashboard/projects/project-folder-graphic";
import { cn } from "@/lib/utils";

type ProjectCreateFolderTileProps = {
  label: string;
  onClick: () => void;
  className?: string;
};

export function ProjectCreateFolderTile({
  label,
  onClick,
  className,
}: ProjectCreateFolderTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col items-center rounded-lg p-2 text-start transition-colors",
        "outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <FinderFolderGraphic colorKey={null} dashed>
        <Plus
          className="size-9 stroke-[1.75] opacity-80 transition-transform group-hover:scale-105"
          aria-hidden
        />
      </FinderFolderGraphic>
      <p className="mt-3 line-clamp-2 min-h-10 w-full max-w-[min(100%,160px)] text-center text-sm text-muted-foreground">
        {label}
      </p>
    </button>
  );
}
