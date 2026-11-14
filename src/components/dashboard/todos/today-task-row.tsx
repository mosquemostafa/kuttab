"use client";

import { TaskCard } from "./task-card";
import type { TodoChecklistItem, TodoDTO } from "@/shared/types/todo.types";
import type { TodoSelectionState } from "./todo-list-types";

type TodayTaskRowProps = {
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
  selection?: TodoSelectionState;
};

export function TodayTaskRow({
  todo,
  onToggle,
  onRename,
  onUpdatePriority,
  onUpdateDueDate,
  onUpdateProject,
  onUpdateChecklist,
  onRequestDelete,
  selection,
}: TodayTaskRowProps) {
  return (
    <TaskCard
      todo={todo}
      onToggle={onToggle}
      onRename={onRename}
      onUpdatePriority={onUpdatePriority}
      onUpdateDueDate={onUpdateDueDate}
      onUpdateProject={onUpdateProject}
      onUpdateChecklist={onUpdateChecklist}
      onRequestDelete={onRequestDelete}
      selection={selection}
    />
  );
}
