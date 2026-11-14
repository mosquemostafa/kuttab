"use client";

import { useCallback, useState, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Square,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TodoChecklistItem } from "@/shared/types/todo.types";
import {
  createChecklistItem,
  reorderChecklistItems,
} from "@/shared/utils/todo-checklist";

type TodoChecklistProps = {
  checklist: TodoChecklistItem[];
  isDone: boolean;
  onChange: (next: TodoChecklistItem[]) => Promise<void>;
};

const MAX_CHECKLIST_ITEMS = 20;

export function TodoChecklist({
  checklist,
  isDone,
  onChange,
}: TodoChecklistProps) {
  const t = useTranslations("todos");
  const [isExpanded, setIsExpanded] = useState(false);
  const [newStepDraft, setNewStepDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const completedCount = checklist.filter((item) => item.isCompleted).length;
  const canAddMore = checklist.length < MAX_CHECKLIST_ITEMS;
  const canReorder = checklist.length > 1 && !isSaving && editingId === null;

  const persist = async (next: TodoChecklistItem[]) => {
    setIsSaving(true);
    try {
      await onChange(next);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (itemId: string) => {
    const next = checklist.map((item) =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item,
    );
    await persist(next);
  };

  const handleDelete = async (itemId: string) => {
    const next = checklist.filter((item) => item.id !== itemId);
    await persist(next);
    if (next.length === 0) {
      setIsExpanded(false);
    }
  };

  const handleAddStep = async () => {
    const trimmed = newStepDraft.trim();
    if (!trimmed || !canAddMore || isSaving) {
      return;
    }

    const next: TodoChecklistItem[] = [
      ...checklist,
      createChecklistItem(trimmed),
    ];

    setNewStepDraft("");
    await persist(next);
  };

  const handleAddKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void handleAddStep();
    }
  };

  const startEditing = (item: TodoChecklistItem) => {
    setEditingId(item.id);
    setEditDraft(item.title);
  };

  const commitEdit = async (itemId: string, originalTitle: string) => {
    const trimmed = editDraft.trim();
    setEditingId(null);

    if (!trimmed || trimmed === originalTitle) {
      setEditDraft("");
      return;
    }

    const next = checklist.map((item) =>
      item.id === itemId ? { ...item, title: trimmed } : item,
    );
    await persist(next);
    setEditDraft("");
  };

  const handleDragStart = useCallback(
    (event: DragEvent<HTMLButtonElement>, stepId: string) => {
      if (!canReorder) {
        event.preventDefault();
        return;
      }

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", stepId);
      setDraggedStepId(stepId);
    },
    [canReorder],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>, index: number) => {
      if (!canReorder || !draggedStepId) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setDragOverIndex(index);
    },
    [canReorder, draggedStepId],
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>, dropIndex: number) => {
      event.preventDefault();

      const stepId = draggedStepId ?? event.dataTransfer.getData("text/plain");
      if (!stepId) {
        return;
      }

      const fromIndex = checklist.findIndex((item) => item.id === stepId);
      if (fromIndex === -1 || fromIndex === dropIndex) {
        setDraggedStepId(null);
        setDragOverIndex(null);
        return;
      }

      const next = reorderChecklistItems(checklist, fromIndex, dropIndex);
      setDraggedStepId(null);
      setDragOverIndex(null);
      await persist(next);
    },
    [checklist, draggedStepId],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedStepId(null);
    setDragOverIndex(null);
  }, []);

  if (checklist.length === 0) {
    return null;
  }

  return (
    <div className="col-span-3 mt-1 space-y-1.5 border-t border-border/40 pt-2">
      <button
        type="button"
        className="flex w-full items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={() => setIsExpanded((value) => !value)}
        aria-expanded={isExpanded}
        aria-label={
          isExpanded ? t("checklist.collapse") : t("checklist.expand")
        }
      >
        {isExpanded ? (
          <ChevronDown className="size-3.5 shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0" />
        )}
        <span>{t("checklist.steps")}</span>
        {checklist.length > 0 ? (
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            {t("checklist.progress", {
              completed: completedCount,
              total: checklist.length,
            })}
          </Badge>
        ) : null}
      </button>

      {isExpanded ? (
        <div className="space-y-1">
          {checklist.map((item, index) => {
            const isDragged = draggedStepId === item.id;
            const isDragOver = dragOverIndex === index;

            return (
              <div
                key={item.id}
                onDragOver={(event) => handleDragOver(event, index)}
                onDrop={(event) => {
                  void handleDrop(event, index);
                }}
                className={cn(
                  "group/step flex items-start gap-1 rounded-md transition-colors sm:gap-1.5",
                  isDragged && "opacity-60",
                  isDragOver && "bg-primary/10 ring-1 ring-primary/30",
                )}
              >
                <button
                  type="button"
                  draggable={canReorder}
                  onDragStart={(event) => handleDragStart(event, item.id)}
                  onDragEnd={handleDragEnd}
                  disabled={!canReorder}
                  aria-label={t("checklist.aria.dragStep")}
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground",
                    canReorder && "cursor-grab active:cursor-grabbing",
                    !canReorder && "pointer-events-none",
                  )}
                >
                  <GripVertical className="size-3.5" />
                </button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="mt-0.5 size-6 shrink-0"
                  onClick={() => {
                    void handleToggle(item.id);
                  }}
                  disabled={isSaving}
                  aria-label={t("checklist.aria.toggleStep")}
                >
                  {item.isCompleted ? (
                    <CheckSquare className="size-3.5 text-muted-foreground" />
                  ) : (
                    <Square className="size-3.5 text-muted-foreground" />
                  )}
                </Button>

                {editingId === item.id ? (
                  <Input
                    value={editDraft}
                    onChange={(event) => setEditDraft(event.target.value)}
                    onBlur={() => {
                      void commitEdit(item.id, item.title);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setEditingId(null);
                        setEditDraft("");
                        return;
                      }
                      if (
                        event.key === "Enter" &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        void commitEdit(item.id, item.title);
                      }
                    }}
                    autoFocus
                    disabled={isSaving}
                    className="h-7 min-w-0 flex-1 text-sm"
                    aria-label={t("checklist.aria.editStep")}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditing(item)}
                    className="min-w-0 flex-1 py-0.5 text-start text-sm"
                    aria-label={t("checklist.aria.editStep")}
                  >
                    <span
                      className={cn(
                        "wrap-break-word",
                        (isDone || item.isCompleted) && "text-muted-foreground",
                        item.isCompleted && "line-through",
                      )}
                    >
                      {item.title}
                    </span>
                  </button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-6 shrink-0"
                  onClick={() => {
                    void handleDelete(item.id);
                  }}
                  disabled={isSaving}
                  aria-label={t("checklist.aria.deleteStep")}
                >
                  <Trash2 className="size-3 text-destructive" />
                </Button>
              </div>
            );
          })}

          {canAddMore ? (
            <div className="relative flex items-center gap-1.5 ps-7 pt-0.5">
              <Plus className="pointer-events-none absolute inset-s-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                value={newStepDraft}
                onChange={(event) => setNewStepDraft(event.target.value)}
                onKeyDown={handleAddKeyDown}
                onBlur={() => {
                  if (newStepDraft.trim()) {
                    void handleAddStep();
                  }
                }}
                placeholder={t("checklist.placeholder")}
                disabled={isSaving}
                className="h-7 pl-7 text-sm placeholder:text-muted-foreground/60"
                aria-label={t("checklist.aria.addStep")}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
