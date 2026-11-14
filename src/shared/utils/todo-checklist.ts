import type { TodoChecklistItem } from "@/shared/types/todo.types";

/** When a task has steps, derive completion from whether every step is done. */
export function resolveCompletionFromChecklist(
  checklist: TodoChecklistItem[],
): boolean | null {
  if (checklist.length === 0) {
    return null;
  }

  return checklist.every((item) => item.isCompleted);
}

export function reorderChecklistItems(
  items: TodoChecklistItem[],
  fromIndex: number,
  toIndex: number,
): TodoChecklistItem[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function createChecklistItem(title: string): TodoChecklistItem {
  return {
    id: crypto.randomUUID(),
    title,
    isCompleted: false,
  };
}
