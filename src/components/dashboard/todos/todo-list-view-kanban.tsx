"use client";

import { type Dispatch, type SetStateAction } from "react";
import { TaskCard } from "./task-card";
import { TaskGroup } from "./task-group";
import { TodoGroupIcon } from "./todo-group-icon";
import type { DisplayGroup } from "./todo-list-types";
import type { TodoChecklistItem, TodoDTO } from "@/shared/types/todo.types";

interface TodoListViewKanbanProps {
  displayGroups: DisplayGroup[];
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

function KanbanColumn({
  groupKey,
  title,
  count,
  todos,
  isOpen,
  onToggleOpen,
  onToggle,
  onRename,
  onUpdatePriority,
  onUpdateDueDate,
  onUpdateProject,
  onUpdateChecklist,
  onRequestDelete,
}: {
  groupKey: string;
  title: string;
  count: number;
  todos: TodoDTO[];
  isOpen: boolean;
  onToggleOpen: () => void;
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
}) {
  return (
    <TaskGroup
      className="min-h-56 w-64 flex-none rounded-xl border border-border/60 bg-card/60 p-2 sm:w-80 sm:p-3"
      title={title}
      icon={<TodoGroupIcon groupKey={groupKey} />}
      count={count}
      isOpen={isOpen}
      onToggleOpen={onToggleOpen}
    >
      <div className="flex flex-col gap-2 flex-1">
        {todos.map((todo) => (
          <TaskCard
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
        ))}
      </div>
    </TaskGroup>
  );
}

export function TodoListViewKanban({
  displayGroups,
  groups,
  setGroups,
  onToggle,
  onRename,
  onUpdatePriority,
  onUpdateDueDate,
  onUpdateProject,
  onUpdateChecklist,
  onRequestDelete,
}: TodoListViewKanbanProps) {
  if (displayGroups.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto pb-1 h-full">
      <div className="flex min-w-max flex-nowrap gap-3 items-stretch h-full">
        {displayGroups.map((group) => (
          <KanbanColumn
            key={group.key}
            groupKey={group.key}
            title={group.title}
            count={group.todos.length}
            todos={group.todos}
            isOpen={groups[group.key] ?? true}
            onToggleOpen={() =>
              setGroups((value) => ({
                ...value,
                [group.key]: !(value[group.key] ?? true),
              }))
            }
            onToggle={onToggle}
            onRename={onRename}
            onUpdatePriority={onUpdatePriority}
            onUpdateDueDate={onUpdateDueDate}
            onUpdateProject={onUpdateProject}
            onUpdateChecklist={onUpdateChecklist}
            onRequestDelete={onRequestDelete}
          />
        ))}
      </div>
    </div>
  );
}
