"use client";

import { type Dispatch, type SetStateAction, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { TaskGroup } from "./task-group";
import { TodayTaskRow } from "./today-task-row";
import { TodoGroupIcon } from "./todo-group-icon";
import type { TodoChecklistItem, TodoDTO } from "@/shared/types/todo.types";

interface TodoListViewEisenhowerProps {
  todayDueTodos: TodoDTO[];
  overdueTodos: TodoDTO[];
  inboxTodos: TodoDTO[];
  futureTodos: TodoDTO[];
  groups: Record<string, boolean>;
  setGroups: Dispatch<SetStateAction<Record<string, boolean>>>;
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
}

export function TodoListViewEisenhower({
  todayDueTodos,
  overdueTodos,
  inboxTodos,
  futureTodos,
  groups,
  setGroups,
  onToggle,
  onRename,
  onUpdatePriority,
  onUpdateDueDate,
  onUpdateProject,
  onUpdateChecklist,
  onRequestDelete,
}: TodoListViewEisenhowerProps) {
  const t = useTranslations("todos");
  const iconColorByQuadrant: Record<string, string> = {
    "urgent-important": "text-destructive",
    "not-urgent-important": "text-amber-500",
    "urgent-not-important": "text-blue-500",
    "not-urgent-not-important": "text-green-500",
  };
  const badgeColorByQuadrant: Record<string, string> = {
    "urgent-important":
      "border-destructive/30 bg-destructive/10 text-destructive",
    "not-urgent-important":
      "border-amber-500/30 bg-amber-500/10 text-amber-600",
    "urgent-not-important": "border-blue-500/30 bg-blue-500/10 text-blue-600",
    "not-urgent-not-important":
      "border-green-500/30 bg-green-500/10 text-green-600",
  };

  const quadrants = useMemo(() => {
    const urgentTodos = [...overdueTodos, ...todayDueTodos];
    const notUrgentTodos = [...futureTodos, ...inboxTodos];

    return [
      {
        key: "urgent-important",
        descriptor: t("matrix.axisUrgentImportant"),
        action: t("matrix.actionDoFirst"),
        todos: urgentTodos.filter((todo) => Boolean(todo.priority)),
      },
      {
        key: "not-urgent-important",
        descriptor: t("matrix.axisNotUrgentImportant"),
        action: t("matrix.actionSchedule"),
        todos: notUrgentTodos.filter((todo) => Boolean(todo.priority)),
      },
      {
        key: "urgent-not-important",
        descriptor: t("matrix.axisUrgentNotImportant"),
        action: t("matrix.actionDelegate"),
        todos: urgentTodos.filter((todo) => !todo.priority),
      },
      {
        key: "not-urgent-not-important",
        descriptor: t("matrix.axisNotUrgentNotImportant"),
        action: t("matrix.actionEliminate"),
        todos: notUrgentTodos.filter((todo) => !todo.priority),
      },
    ];
  }, [futureTodos, inboxTodos, overdueTodos, t, todayDueTodos]);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {quadrants.map((quadrant) => (
        <TaskGroup
          key={quadrant.key}
          className="rounded-xl border border-border/60 bg-card/60 p-2 sm:p-3"
          title={
            <span className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-base text-foreground sm:text-lg md:text-xl">
                ({quadrant.descriptor})
              </span>
              <Badge
                variant="outline"
                className={`text-sm md:text-base ${badgeColorByQuadrant[quadrant.key]}`}
              >
                {quadrant.action}
              </Badge>
            </span>
          }
          truncateTitle={false}
          titleClassName="text-xl sm:text-2xl md:text-[2rem]"
          icon={
            <TodoGroupIcon
              groupKey={quadrant.key}
              className={iconColorByQuadrant[quadrant.key]}
            />
          }
          count={quadrant.todos.length}
          isOpen={groups[quadrant.key] ?? true}
          onToggleOpen={() =>
            setGroups((value) => ({
              ...value,
              [quadrant.key]: !(value[quadrant.key] ?? true),
            }))
          }
        >
          {quadrant.todos.length === 0 ? (
            <p className="px-1 py-2 text-sm text-muted-foreground">
              {t("messages.noTasks")}
            </p>
          ) : (
            quadrant.todos.map((todo) => (
              <TodayTaskRow
                key={todo.id}
                todo={todo}
                onToggle={onToggle}
                onRename={onRename}
                onUpdatePriority={onUpdatePriority}
                onUpdateDueDate={onUpdateDueDate}
                onUpdateProject={onUpdateProject}
                onUpdateChecklist={onUpdateChecklist}
                onRequestDelete={onRequestDelete}
              />
            ))
          )}
        </TaskGroup>
      ))}
    </div>
  );
}
