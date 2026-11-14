"use client";

import { useMemo, useState } from "react";
import { isBefore, startOfDay } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import {
  EllipsisVertical,
  CheckSquare,
  CircleDashed,
  CalendarPlus,
  CheckCircle2,
  Circle,
  Plus,
  Square,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ProjectBadgePicker } from "@/components/projects/project-badge-picker";
import { cn } from "@/lib/utils";
import type { TodoChecklistItem, TodoDTO } from "@/shared/types/todo.types";
import { createChecklistItem } from "@/shared/utils/todo-checklist";
import { EditableTodoTitle } from "./editable-todo-title";
import { parseDateOnlyToLocal, toDateOnlyString } from "./todo-date-utils";
import { TodoChecklist } from "./todo-checklist";
import { TodoDueDatePicker } from "./todo-due-date-picker";
import type { TodoSelectionState } from "./todo-list-types";

type TaskCardProps = {
  todo: TodoDTO;
  onToggle: (todo: TodoDTO) => Promise<void>;
  onRename: (todo: TodoDTO, nextTitle: string) => Promise<void>;
  onUpdatePriority: (
    todo: TodoDTO,
    priority?: "low" | "medium" | "high" | null,
  ) => Promise<void>;
  onUpdateDueDate: (todo: TodoDTO, dueDate?: string | null) => Promise<void>;
  onUpdateProject: (todo: TodoDTO, projectId: string | null) => Promise<void>;
  onUpdateChecklist: (
    todo: TodoDTO,
    checklist: TodoChecklistItem[],
  ) => Promise<void>;
  onRequestDelete: (todo: TodoDTO) => void;
  className?: string;
  selection?: TodoSelectionState;
};

export function TaskCard({
  todo,
  onToggle,
  onRename,
  onUpdatePriority,
  onUpdateDueDate,
  onUpdateProject,
  onUpdateChecklist,
  onRequestDelete,
  className,
  selection,
}: TaskCardProps) {
  const t = useTranslations("todos");
  const locale = useLocale();
  const [isUpdatingDueDate, setIsUpdatingDueDate] = useState(false);
  const [isAddSubtaskOpen, setIsAddSubtaskOpen] = useState(false);
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [isSavingSubtask, setIsSavingSubtask] = useState(false);
  const dueDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }),
    [locale],
  );
  const isDone = todo.isCompleted;
  const dueDate = todo.dueDate ? parseDateOnlyToLocal(todo.dueDate) : null;
  const checklist = todo.checklist ?? [];
  const canAddSubtask = checklist.length < 20;

  if (selection?.isEnabled) {
    const isSelected = selection.selectedIds.has(todo.id);
    return (
      <button
        type="button"
        onClick={() => selection.onToggle(todo.id)}
        aria-pressed={isSelected}
        aria-label={t("aria.selectTask")}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border p-2 text-start transition-colors sm:gap-3 sm:p-3",
          isSelected
            ? "border-primary/40 bg-primary/5 opacity-60"
            : "border-border/60 bg-transparent hover:bg-sky-50/20 dark:hover:bg-slate-800/50",
          className,
        )}
      >
        {isSelected ? (
          <CheckCircle2 className="size-5 shrink-0 text-primary sm:size-6" />
        ) : (
          <Circle className="size-5 shrink-0 text-muted-foreground sm:size-6" />
        )}
        <span className="min-w-0 flex-1 truncate text-base font-medium sm:text-lg">
          {todo.title}
        </span>
        {todo.priority ? (
          <Badge variant="outline" className="h-5 px-1.5 text-xs">
            {todo.priority === "high"
              ? "🔥"
              : todo.priority === "medium"
                ? "💧"
                : "🧊"}
          </Badge>
        ) : null}
      </button>
    );
  }

  const handleAddSubtask = async () => {
    const trimmed = subtaskDraft.trim();
    if (!trimmed || !canAddSubtask || isSavingSubtask) {
      return;
    }

    setIsSavingSubtask(true);
    try {
      const nextChecklist: TodoChecklistItem[] = [
        ...checklist,
        createChecklistItem(trimmed),
      ];

      await onUpdateChecklist(todo, nextChecklist);
      setSubtaskDraft("");
      setIsAddSubtaskOpen(false);
    } finally {
      setIsSavingSubtask(false);
    }
  };

  return (
    <div
      className={cn(
        "group grid grid-cols-[auto_1fr] items-start gap-1 rounded-xl border border-border/60 bg-transparent p-2 shadow-sm transition-all duration-150 hover:bg-sky-50/20 dark:hover:bg-slate-800/50 dark:border-border/60 sm:gap-2 sm:p-3",
        className,
      )}
    >
      <div className="col-span-2 grid min-w-0 grid-cols-[auto_1fr_auto] items-start gap-x-1 gap-y-1 sm:gap-x-2 sm:gap-y-1.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            void onToggle(todo);
          }}
          aria-label={isDone ? t("aria.markAsNotDone") : t("aria.markAsDone")}
          className="mt-0.5 shrink-0"
        >
          {isDone ? (
            <CheckSquare className="text-muted-foreground" />
          ) : (
            <Square className="text-muted-foreground" />
          )}
        </Button>

        <EditableTodoTitle
          title={todo.title}
          isDone={isDone}
          onSave={(nextTitle) => onRename(todo, nextTitle)}
          textClassName="break-words whitespace-pre-wrap text-lg font-medium sm:text-xl"
          inputClassName="min-h-8 border-border/60 sm:min-h-9"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("aria.taskMenu")}
              className="size-7 shrink-0 opacity-60 transition-opacity group-hover:opacity-100 sm:size-8"
            >
              <EllipsisVertical className="size-3.5 sm:size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onSelect={() => {
                setSubtaskDraft("");
                setIsAddSubtaskOpen(true);
              }}
            >
              <Plus className="size-3.5 text-muted-foreground" />
              {t("checklist.aria.addStep")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onRequestDelete(todo)}
            >
              <Trash2 className="size-3.5" />
              {t("aria.deleteTask")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="col-span-3 mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground sm:gap-2 sm:text-sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center rounded-md px-1 py-0.5 text-[10px] font-medium outline-none transition-colors hover:bg-muted hover:text-foreground cursor-pointer sm:rounded-lg sm:px-2 sm:py-1 sm:text-sm"
                aria-label={t("aria.changePriority")}
              >
                {todo.priority ? (
                  <Badge
                    variant="outline"
                    className="h-4 gap-0 px-1 py-0 text-[10px] leading-none sm:h-5 sm:gap-1 sm:px-2 sm:text-sm sm:leading-normal"
                  >
                    {todo.priority === "high"
                      ? "🔥"
                      : todo.priority === "medium"
                        ? "💧"
                        : "🧊"}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="h-4 px-1 py-0 text-muted-foreground sm:h-5 sm:px-2 sm:text-sm"
                  >
                    <CircleDashed className="size-2.5 sm:size-3" />
                  </Badge>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuRadioGroup
                value={todo.priority ?? "none"}
                onValueChange={(value) => {
                  const nextPriority =
                    value === "none"
                      ? null
                      : (value as "low" | "medium" | "high");
                  void onUpdatePriority(todo, nextPriority);
                }}
              >
                <DropdownMenuRadioItem value="none">
                  {t("priority.none")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="high">
                  {t("priority.high")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="medium">
                  {t("priority.medium")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="low">
                  {t("priority.low")}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <TodoDueDatePicker
            value={dueDate ?? undefined}
            align="start"
            onSave={async (nextDate) => {
              setIsUpdatingDueDate(true);
              try {
                await onUpdateDueDate(
                  todo,
                  nextDate ? toDateOnlyString(startOfDay(nextDate)) : null,
                );
              } finally {
                setIsUpdatingDueDate(false);
              }
            }}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size={dueDate ? "sm" : "icon-sm"}
                className={
                  dueDate
                    ? "h-7 gap-1 px-1 py-0 text-[10px] sm:h-8 sm:gap-1.5 sm:px-2 sm:py-1 sm:text-sm"
                    : "size-7 sm:size-8"
                }
                aria-label={t("aria.selectDueDate")}
                disabled={isUpdatingDueDate}
              >
                {dueDate ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-4 px-1 py-0 text-[10px] leading-tight sm:h-5 sm:px-2 sm:text-sm sm:leading-normal",
                      isDone
                        ? "text-muted-foreground"
                        : isBefore(dueDate, startOfDay(new Date()))
                          ? "text-destructive"
                          : "text-foreground",
                    )}
                  >
                    {dueDateFormatter.format(dueDate)}
                  </Badge>
                ) : (
                  <CalendarPlus className="size-3.5 text-muted-foreground sm:size-4" />
                )}
              </Button>
            }
          />

          <ProjectBadgePicker
            projectId={todo.projectId}
            onChange={(nextId) => onUpdateProject(todo, nextId)}
            noneLabel={t("quickCreate.noProject")}
            unknownProjectLabel={t("messages.unknownProject")}
            ariaLabel={t("aria.changeProject")}
            align="start"
            dimmed={isDone}
          />
        </div>

        <TodoChecklist
          checklist={checklist}
          isDone={isDone}
          onChange={(next) => onUpdateChecklist(todo, next)}
        />
      </div>

      <Dialog
        open={isAddSubtaskOpen}
        onOpenChange={(open) => {
          setIsAddSubtaskOpen(open);
          if (!open) {
            setSubtaskDraft("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("checklist.aria.addStep")}</DialogTitle>
          </DialogHeader>

          <Input
            value={subtaskDraft}
            onChange={(event) => setSubtaskDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void handleAddSubtask();
              }
            }}
            placeholder={t("checklist.placeholder")}
            disabled={isSavingSubtask}
            autoFocus
          />

          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                void handleAddSubtask();
              }}
              disabled={isSavingSubtask || !subtaskDraft.trim()}
            >
              {t("checklist.aria.addStep")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
