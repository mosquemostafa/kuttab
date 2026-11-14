"use client";

import { FolderOpen, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useProjectsStore } from "@/components/projects/projects-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { projectColorKeyToIconTextClass } from "@/shared/constants/color-palette";

type ProjectSelectOption =
  | { kind: "all"; value: "all"; label: string }
  | { kind: "none"; value: "none"; label: string }
  | {
      kind: "project";
      value: string;
      label: string;
      icon?: string | null;
      folderIconTintClass?: string;
    };

export function ProjectSelect({
  value,
  onValueChange,
  disabled,
  includeAll = true,
  allLabel = "All projects",
  includeNone = false,
  noneLabel = "No project",
  placeholder = "Project",
  className,
}: {
  value?: string | null;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  includeAll?: boolean;
  allLabel?: string;
  includeNone?: boolean;
  noneLabel?: string;
  placeholder?: string;
  className?: string;
}) {
  const t = useTranslations("projects");
  const { projects } = useProjectsStore();
  const hasProjects = projects.length > 0;

  const options: ProjectSelectOption[] = [
    ...(includeAll
      ? ([{ kind: "all", value: "all", label: allLabel }] as const)
      : []),
    ...(includeNone
      ? ([{ kind: "none", value: "none", label: noneLabel }] as const)
      : []),
    ...projects.map((p) => ({
      kind: "project" as const,
      value: p.id,
      label: p.name,
      icon: p.icon,
      folderIconTintClass: projectColorKeyToIconTextClass(p.colorKey),
    })),
  ];

  const normalizedValue =
    value ?? (includeAll ? "all" : includeNone ? "none" : undefined);
  const selected = options.find((o) => o.value === normalizedValue);

  return (
    <Select
      value={normalizedValue}
      disabled={disabled}
      onValueChange={onValueChange}
    >
      <SelectTrigger
        className={cn(
          "h-9 w-full min-w-0 rounded-xl border-border/60 bg-card/60 max-sm:[&>svg]:hidden sm:[&>svg]:block",
          className,
        )}
      >
        <SelectValue>
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <FolderOpen
                className={cn(
                  "size-4 shrink-0",
                  selected.kind === "all" ||
                    selected.kind === "none" ||
                    !("folderIconTintClass" in selected) ||
                    !selected.folderIconTintClass
                    ? "text-muted-foreground"
                    : selected.folderIconTintClass,
                )}
                aria-hidden
              />
              <span className="min-w-0 truncate">{selected.label}</span>
              {selected.kind === "project" && selected.icon ? (
                <span className="shrink-0">{selected.icon}</span>
              ) : null}
            </span>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="max-h-72">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            <span className="flex items-center gap-2">
              <FolderOpen
                className={cn(
                  "size-4 shrink-0",
                  o.kind === "all" ||
                    o.kind === "none" ||
                    (o.kind === "project" && !o.folderIconTintClass)
                    ? "text-muted-foreground"
                    : o.kind === "project"
                      ? o.folderIconTintClass
                      : undefined,
                )}
                aria-hidden
              />
              <span className="min-w-0 truncate">{o.label}</span>
              {o.kind === "project" && o.icon ? (
                <span className="shrink-0">{o.icon}</span>
              ) : null}
            </span>
          </SelectItem>
        ))}
        {!hasProjects ? (
          <div className="border-t px-2 py-2">
            <Link
              href="/dashboard/projects"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-primary hover:bg-primary/10"
            >
              <Plus className="size-4" aria-hidden />
              <span>{t("list.createProjectHint")}</span>
            </Link>
          </div>
        ) : null}
      </SelectContent>
    </Select>
  );
}
