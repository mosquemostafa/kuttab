export type TodoPriority = "low" | "medium" | "high";

export interface TodoChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface TodoDTO {
  id: string;
  userId: string;
  title: string;
  projectId: string | null;
  checklist: TodoChecklistItem[];
  isCompleted: boolean;
  priority: TodoPriority | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}
