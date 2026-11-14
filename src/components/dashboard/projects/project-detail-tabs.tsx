"use client";

import { ArrowLeft, Folder } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { TodoList } from "@/components/dashboard/todos/todo-list";
import { projectColorKeyToIconTextClass } from "@/shared/constants/color-palette";
import { cn } from "@/lib/utils";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";
import { useTranslations } from "next-intl";
import type { ProjectDTO } from "@/shared/types/project.types";

type ProjectDetailTabsProps = {
  project: ProjectDTO;
  counts?: {
    todos: number;
  };
};

export function ProjectDetailTabs({ project }: ProjectDetailTabsProps) {
  useSetBreadcrumb(project.id, project.name);
  const t = useTranslations("projects");
  const folderTintClass = projectColorKeyToIconTextClass(project.colorKey);

  return (
    <div className="flex flex-col gap-6">
      {/* Header section with back button, project title, and meta */}
      <div className="flex flex-col gap-3">
        <div>
          <Link
            href="/dashboard/projects"
            prefetch={false}
            className="group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
            <span>{t("backToProjects")}</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {project.icon ? (
              <span className="text-2xl select-none" role="img" aria-hidden>
                {project.icon}
              </span>
            ) : (
              <Folder
                className={cn(
                  "size-6 shrink-0",
                  folderTintClass ?? "text-muted-foreground",
                )}
                aria-hidden
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-heading truncate text-2xl font-semibold tracking-tight">
                  {project.name}
                </h1>
                {project.isArchived ? (
                  <Badge variant="secondary" className="text-xs">
                    {t("list.archivedBadge")}
                  </Badge>
                ) : null}
              </div>
              {project.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {project.description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Project Todos */}
      <div>
        <TodoList
          projectId={project.id}
          projectName={project.name}
          projectColorKey={project.colorKey}
        />
      </div>
    </div>
  );
}
