"use client";

import { type Dispatch, type SetStateAction } from "react";
import { TaskGroup } from "./task-group";
import { TodayTaskRow } from "./today-task-row";
import { TodoGroupIcon } from "./todo-group-icon";
import type { DisplayGroup, TodoSelectionState } from "./todo-list-types";
import type { TodoChecklistItem, TodoDTO } from "@/shared/types/todo.types";

interface TodoListViewListProps {
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
  selection?: TodoSelectionState;
}

export function TodoListViewList({
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
  selection,
}: TodoListViewListProps) {
  const hasAnyGroups = displayGroups.length > 0;

  if (!hasAnyGroups) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {displayGroups.map((group) => (
        <TaskGroup
          key={group.key}
          title={group.title}
          icon={<TodoGroupIcon groupKey={group.key} />}
          count={group.todos.length}
          isOpen={groups[group.key] ?? true}
          onToggleOpen={() =>
            setGroups((value) => ({
              ...value,
              [group.key]: !(value[group.key] ?? true),
            }))
          }
        >
          {group.todos.map((todo) => (
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
              selection={selection}
            />
          ))}
        </TaskGroup>
      ))}
    </div>
  );
}
