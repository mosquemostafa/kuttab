"use client";

import { useState } from "react";
import { format, isSameDay, startOfDay } from "date-fns";
import { CalendarDays, Flame, FolderOpen, Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { apiClient } from "@/lib/api/api-client";
import { useApiErrorMessage } from "@/lib/api/use-api-error-message";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ProjectPickerDropdown } from "@/components/projects/project-picker-dropdown";
import { useProjectsStore } from "@/components/projects/projects-store";
import { TodoDueDatePicker } from "@/components/dashboard/todos/todo-due-date-picker";
import { cn } from "@/lib/utils";

type QuickTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function QuickTaskDialog({
  open,
  onOpenChange,
  onSuccess,
}: QuickTaskDialogProps) {
  const t = useTranslations("dashboard.overview.quickCapture.taskDialog");
  const getErrorMessage = useApiErrorMessage();
  const { getProjectById } = useProjectsStore();

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(() =>
    startOfDay(new Date()),
  );
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | undefined
  >(undefined);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDueDate(startOfDay(new Date()));
    setPriority(undefined);
    setProjectId(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isSubmitting) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await apiClient.todos.create({
        title: trimmedTitle,
        dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        ...(priority ? { priority } : {}),
        ...(projectId ? { projectId } : { projectId: null }),
      });

      toast.success(t("success"));
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolvedProjectName = projectId
    ? (getProjectById(projectId)?.name ?? t("noProject"))
    : t("noProject");

  const formattedDueDate = dueDate
    ? isSameDay(dueDate, startOfDay(new Date()))
      ? t("today")
      : format(dueDate, "yyyy-MM-dd")
    : t("dueDate");

  const priorityColorClass =
    priority === "high"
      ? "text-red-500 fill-red-500/20"
      : priority === "medium"
        ? "text-amber-500 fill-amber-500/20"
        : priority === "low"
          ? "text-blue-500 fill-blue-500/20"
          : "text-muted-foreground";

  const priorityLabel =
    priority === "high"
      ? t("priorityHigh")
      : priority === "medium"
        ? t("priorityMedium")
        : priority === "low"
          ? t("priorityLow")
          : t("priority");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-emerald-500" />
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("taskTitlePlaceholder")}
              autoFocus
              disabled={isSubmitting}
              className="text-sm font-medium"
            />
          </div>

          {/* Quick meta selectors: Due date, Priority, Project */}
          <div className="flex flex-wrap items-center gap-2">
            <TodoDueDatePicker
              value={dueDate}
              onSave={(next) => setDueDate(next)}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 gap-1.5 text-xs font-normal",
                    dueDate && "border-primary/40 bg-primary/5 text-primary",
                  )}
                >
                  <CalendarDays className="size-3.5" />
                  <span>{formattedDueDate}</span>
                </Button>
              }
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 gap-1.5 text-xs font-normal",
                    priority && "border-amber-500/40 bg-amber-500/5",
                  )}
                >
                  <Flame className={cn("size-3.5", priorityColorClass)} />
                  <span>{priorityLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuRadioGroup
                  value={priority ?? "none"}
                  onValueChange={(val) =>
                    setPriority(
                      val === "none"
                        ? undefined
                        : (val as "low" | "medium" | "high"),
                    )
                  }
                >
                  <DropdownMenuRadioItem value="none">
                    {t("priorityNone")}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="low">
                    {t("priorityLow")}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="medium">
                    {t("priorityMedium")}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="high">
                    {t("priorityHigh")}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <ProjectPickerDropdown
              value={projectId}
              onChange={(next) => setProjectId(next)}
              noneLabel={t("noProject")}
              ariaLabel={t("project")}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 gap-1.5 text-xs font-normal",
                    projectId && "border-primary/40 bg-primary/5 text-primary",
                  )}
                >
                  <FolderOpen className="size-3.5" />
                  <span className="max-w-28 truncate">
                    {resolvedProjectName}
                  </span>
                </Button>
              }
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim() || isSubmitting}
              className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t("creating")}</span>
                </>
              ) : (
                <span>{t("create")}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
