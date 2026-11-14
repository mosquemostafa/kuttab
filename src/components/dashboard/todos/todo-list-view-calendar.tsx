"use client";

import { addDays, format, isSameDay, startOfDay } from "date-fns";
import {
  type Dispatch,
  type SetStateAction,
  type DragEvent,
  useState,
} from "react";
import {
  Plus,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { TaskGroup } from "./task-group";
import { TodayTaskRow } from "./today-task-row";
import { TodoGroupIcon } from "./todo-group-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DisplayGroup } from "./todo-list-types";
import type { TodoChecklistItem, TodoDTO } from "@/shared/types/todo.types";
import { useTranslations } from "next-intl";

interface TodoListViewCalendarProps {
  calendarWeekStart: Date;
  setCalendarWeekStart: (day: Date) => void;
  weekStartDefault: Date;
  nextSevenDays: Date[];
  calendarDayTitleFormatter: Intl.DateTimeFormat;
  todayDate: string;
  calendarInputDayKey: string | null;
  setCalendarInputDayKey: Dispatch<SetStateAction<string | null>>;
  calendarQuickTitle: string;
  setCalendarQuickTitle: (title: string) => void;
  calendarQuickPriority: "low" | "medium" | "high" | undefined;
  setCalendarQuickPriority: (
    priority: "low" | "medium" | "high" | undefined,
  ) => void;
  isCreating: boolean;
  onCalendarQuickCreate: (day: Date) => Promise<void>;
  calendarActiveTodos: TodoDTO[];
  calendarCompletedTodos: TodoDTO[];
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
  onMoveTodo: (todo: TodoDTO, targetDueDate: Date) => Promise<void>;
  groups: Record<string, boolean>;
  setGroups: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function TodoListViewCalendar({
  calendarWeekStart,
  setCalendarWeekStart,
  weekStartDefault,
  nextSevenDays,
  calendarDayTitleFormatter,
  todayDate,
  calendarInputDayKey,
  setCalendarInputDayKey,
  calendarQuickTitle,
  setCalendarQuickTitle,
  calendarQuickPriority,
  setCalendarQuickPriority,
  isCreating,
  onCalendarQuickCreate,
  calendarActiveTodos,
  calendarCompletedTodos,
  onToggle,
  onRename,
  onUpdatePriority,
  onUpdateDueDate,
  onUpdateProject,
  onUpdateChecklist,
  onRequestDelete,
  onMoveTodo,
  groups,
  setGroups,
}: TodoListViewCalendarProps) {
  const t = useTranslations("todos");
  const calendarWeekEnd = addDays(calendarWeekStart, 6);
  const [draggingTodoId, setDraggingTodoId] = useState<string | null>(null);
  const calendarRangeFormatter = new Intl.DateTimeFormat(
    calendarDayTitleFormatter.resolvedOptions().locale,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    },
  );
  const calendarRangeStartLabel =
    calendarRangeFormatter.format(calendarWeekStart);
  const calendarRangeEndLabel = calendarRangeFormatter.format(calendarWeekEnd);

  const handleDragStart = (todo: TodoDTO, event: DragEvent<HTMLElement>) => {
    setDraggingTodoId(todo.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", todo.id);
  };

  const handleDragEnd = () => {
    setDraggingTodoId(null);
  };

  const handleDrop = async (day: Date, event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const draggedId =
      event.dataTransfer.getData("text/plain") || draggingTodoId;
    if (!draggedId) return;

    const draggedTodo =
      calendarActiveTodos.find((todo) => todo.id === draggedId) ||
      calendarCompletedTodos.find((todo) => todo.id === draggedId);

    if (!draggedTodo) {
      return;
    }

    const targetDayKey = format(day, "yyyy-MM-dd");
    const currentDayKey = draggedTodo.dueDate;

    if (currentDayKey === targetDayKey) {
      setDraggingTodoId(null);
      return;
    }

    const targetDate = new Date(`${targetDayKey}T00:00:00.000Z`);
    await onMoveTodo(draggedTodo, targetDate);
    setDraggingTodoId(null);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  function getCalendarGroups(day: Date): DisplayGroup[] {
    const dayKey = format(day, "yyyy-MM-dd");
    const isTodayColumn = dayKey === todayDate;

    const dayActiveTodos = calendarActiveTodos.filter((todo) => {
      if (!todo.dueDate) {
        return false;
      }

      return todo.dueDate === dayKey;
    });

    const dayCompletedTodos = calendarCompletedTodos.filter(
      (todo) => todo.dueDate === dayKey,
    );

    const groupsList: DisplayGroup[] = [];

    groupsList.push({
      key: "tasks",
      title: isTodayColumn ? t("groups.today") : t("groups.tasks"),
      todos: dayActiveTodos,
    });

    groupsList.push({
      key: "completed",
      title: t("groups.completed"),
      todos: dayCompletedTodos,
    });

    return groupsList.filter((group) => group.todos.length > 0);
  }

  return (
    <>
      <div className="mb-2 flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card/60 p-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setCalendarWeekStart(startOfDay(addDays(calendarWeekStart, -7)))
            }
            aria-label={t("aria.prevWeek")}
          >
            <ChevronLeftIcon className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCalendarWeekStart(weekStartDefault)}
          >
            {t("labels.today")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setCalendarWeekStart(startOfDay(addDays(calendarWeekStart, 7)))
            }
            aria-label={t("aria.nextWeek")}
          >
            <ChevronRightIcon className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
        <p className="flex items-center justify-center gap-2 text-center font-semibold">
          <span>{calendarRangeStartLabel}</span>
          <ArrowRightIcon className="h-4 w-4 rtl:hidden" />
          <ArrowLeftIcon className="hidden h-4 w-4 rtl:block" />
          <span>{calendarRangeEndLabel}</span>
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max flex-nowrap gap-3">
          {nextSevenDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const isYesterday = isSameDay(day, addDays(new Date(), -1));
            const isToday = isSameDay(day, new Date());
            const isTomorrow = isSameDay(day, addDays(new Date(), 1));

            const dayTitle = isYesterday
              ? t("labels.yesterday")
              : isToday
                ? t("labels.today")
                : isTomorrow
                  ? t("labels.tomorrow")
                  : calendarDayTitleFormatter.format(day);

            const dayGroups = getCalendarGroups(day);

            return (
              <section
                key={dayKey}
                onDragOver={handleDragOver}
                onDrop={(event) => {
                  void handleDrop(day, event);
                }}
                className={
                  "flex min-h-56 w-80 flex-none flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-3 " +
                  (isToday ? "border-2 border-border dark:border-white/80" : "")
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {dayTitle}
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Add task for ${dayTitle}`}
                    onClick={() => {
                      setCalendarInputDayKey((value) =>
                        value === dayKey ? null : dayKey,
                      );
                      setCalendarQuickTitle("");
                      setCalendarQuickPriority(undefined);
                    }}
                  >
                    <Plus />
                  </Button>
                </div>

                {calendarInputDayKey === dayKey ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void onCalendarQuickCreate(day);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-2 py-2"
                  >
                    <Input
                      value={calendarQuickTitle}
                      onChange={(event) =>
                        setCalendarQuickTitle(event.target.value)
                      }
                      placeholder={t("quickCreate.placeholder")}
                      className="h-9 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                      aria-label={`Task title for ${dayTitle}`}
                    />

                    {calendarQuickPriority ? (
                      <Badge
                        variant="outline"
                        className="min-w-8 justify-center"
                      >
                        {calendarQuickPriority === "high"
                          ? "🔥"
                          : calendarQuickPriority === "medium"
                            ? "💧"
                            : "🧊"}
                      </Badge>
                    ) : null}

                    {/* Priority dropdown omitted for brevity (can reuse from main if needed) */}

                    <Button
                      type="submit"
                      size="icon-sm"
                      disabled={isCreating || !calendarQuickTitle.trim()}
                      aria-label={t("aria.addTaskForDay", { day: dayTitle })}
                    >
                      <Plus />
                    </Button>
                  </form>
                ) : null}

                {dayGroups.length === 0 ? (
                  <p className="px-1 text-sm text-muted-foreground">
                    {t("messages.noTasks")}
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {dayGroups.map((group) => {
                      const groupStateKey = `${dayKey}:${group.key}`;

                      return (
                        <TaskGroup
                          key={groupStateKey}
                          title={group.title}
                          icon={<TodoGroupIcon groupKey={group.key} />}
                          count={group.todos.length}
                          isOpen={groups[groupStateKey] ?? true}
                          onToggleOpen={() =>
                            setGroups((value) => ({
                              ...value,
                              [groupStateKey]: !(value[groupStateKey] ?? true),
                            }))
                          }
                        >
                          {group.todos.map((todo) => {
                            const isBeingDragged = draggingTodoId === todo.id;
                            const isCompleted = todo.isCompleted;

                            return (
                              <div
                                key={todo.id}
                                draggable={!isCompleted}
                                onDragStart={
                                  !isCompleted
                                    ? (event) => handleDragStart(todo, event)
                                    : undefined
                                }
                                onDragEnd={
                                  !isCompleted ? handleDragEnd : undefined
                                }
                                className={
                                  (isBeingDragged ? "opacity-50 " : "") +
                                  (!isCompleted
                                    ? "cursor-grab active:cursor-grabbing"
                                    : "cursor-not-allowed")
                                }
                                aria-disabled={isCompleted}
                              >
                                <TodayTaskRow
                                  todo={todo}
                                  onToggle={onToggle}
                                  onRename={onRename}
                                  onUpdatePriority={onUpdatePriority}
                                  onUpdateDueDate={onUpdateDueDate}
                                  onUpdateProject={onUpdateProject}
                                  onUpdateChecklist={onUpdateChecklist}
                                  onRequestDelete={onRequestDelete}
                                />
                              </div>
                            );
                          })}
                        </TaskGroup>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
