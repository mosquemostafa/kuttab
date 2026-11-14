import type { TodoDTO } from "@/shared/types/todo.types";

export type SortOption = "date" | "title" | "priority";
export type SortDirection = "asc" | "desc";
export type ViewMode = "list" | "kanban" | "calendar" | "eisenhower";

/** Which task bucket to load (one API request at a time; not used in calendar view). */
export type TodoListScope = "today" | "inbox" | "future" | "overdue" | "all";

export type TodoListSettings = {
  sortBy: SortOption;
  sortDirection: SortDirection;
  viewMode: ViewMode;
};

export type DisplayGroup = {
  key: string;
  title: string;
  todos: TodoDTO[];
};

export type TodoSelectionState = {
  isEnabled: boolean;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
};
