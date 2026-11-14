"use client";

import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FinderFolderGraphic } from "@/components/dashboard/projects/project-folder-graphic";
import { cn } from "@/lib/utils";
import type { ProjectDTO } from "@/shared/types/project.types";

type ProjectFolderTileProps = {
  project: ProjectDTO;
  labels: {
    archivedBadge: string;
    edit: string;
    archive: string;
    unarchive: string;
    delete: string;
    menuAria: string;
  };
  isBusy: boolean;
  onEdit: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
};

export function ProjectFolderTile({
  project,
  labels,
  isBusy,
  onEdit,
  onArchiveToggle,
  onDelete,
}: ProjectFolderTileProps) {
  const colorKey = project.colorKey;
  const hasTint = colorKey != null;

  const projectHref = `/dashboard/projects/${encodeURIComponent(project.id)}`;

  return (
    <div className="flex w-full flex-col items-center p-2">
      <Link
        href={projectHref}
        prefetch={false}
        className={cn(
          "relative block w-full max-w-28 rounded-lg outline-none transition-opacity",
          "hover:opacity-90 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <FinderFolderGraphic
          colorKey={colorKey}
          icon={project.icon}
          dashed={!hasTint}
        />
      </Link>
      <div className="mt-3 flex w-full max-w-[min(100%,200px)] items-start justify-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground"
              disabled={isBusy}
              aria-label={labels.menuAria}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" />
              {labels.edit}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onArchiveToggle}>
              {project.isArchived ? (
                <ArchiveRestore className="size-4" />
              ) : (
                <Archive className="size-4" />
              )}
              {project.isArchived ? labels.unarchive : labels.archive}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="size-4" />
              {labels.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="min-w-0 flex-1 pt-0.5">
          <Link
            href={projectHref}
            prefetch={false}
            className="line-clamp-2 text-pretty text-start text-sm font-medium leading-tight text-foreground underline-offset-4"
          >
            {project.name}
          </Link>
          {project.isArchived ? (
            <div className="mt-1">
              <Badge variant="secondary" className="text-[10px] font-normal">
                {labels.archivedBadge}
              </Badge>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
