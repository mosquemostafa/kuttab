"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { Undo2 } from "lucide-react";
import toast from "react-hot-toast";
import useSWR from "swr";

import { useApiErrorMessage } from "@/lib/api/use-api-error-message";
import { useProjectsStore } from "@/components/projects/projects-store";
import { apiClient } from "@/lib/api/api-client";
import type { ColorKey } from "@/shared/constants/color-palette";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { TodoListControls, TodoListCreateForm } from "./todo-list-controls";
import { TodoListViewList } from "./todo-list-view-list";
import { TodoListViewKanban } from "./todo-list-view-kanban";
import { TodoListViewCalendar } from "./todo-list-view-calendar";
import { TodoListViewEisenhower } from "./todo-list-view-eisenhower";
import { toDateOnlyString } from "./todo-date-utils";
import type {
  SortDirection,
  SortOption,
  TodoListScope,
  ViewMode,
  TodoListSettings,
  DisplayGroup,
  TodoSelectionState,
} from "./todo-list-types";
import type { ListTodosQueryDTO } from "@/server/modules/todos/todo.dto";
import type { TodoChecklistItem, TodoDTO } from "@/shared/types/todo.types";
import { resolveCompletionFromChecklist } from "@/shared/utils/todo-checklist";

type TodosPage = {
  items: TodoDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const TODO_SETTINGS_STORAGE_KEY = "todo-list-settings";

const DEFAULT_TODO_LIST_SETTINGS: TodoListSettings = {
  sortBy: "date",
  sortDirection: "desc",
  viewMode: "list",
};

function parseSortOption(value: string | null): SortOption | undefined {
  return value === "date" || value === "title" || value === "priority"
    ? value
    : undefined;
}

function parseSortDirection(value: string | null): SortDirection | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

function readStoredTodoListSettings(): Partial<TodoListSettings> {
  if (typeof window === "undefined") return {};

  const raw = window.localStorage.getItem(TODO_SETTINGS_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as {
      sortBy?: unknown;
      sortDirection?: unknown;
      viewMode?: unknown;
    };

    return {
      ...(parseSortOption(
        typeof parsed.sortBy === "string" ? parsed.sortBy : null,
      )
        ? {
            sortBy: parseSortOption(
              typeof parsed.sortBy === "string" ? parsed.sortBy : null,
            ),
          }
        : {}),
      ...(parseSortDirection(
        typeof parsed.sortDirection === "string" ? parsed.sortDirection : null,
      )
        ? {
            sortDirection: parseSortDirection(
              typeof parsed.sortDirection === "string"
                ? parsed.sortDirection
                : null,
            ),
          }
        : {}),
      ...(typeof parsed.viewMode === "string" &&
      (parsed.viewMode === "list" ||
        parsed.viewMode === "kanban" ||
        parsed.viewMode === "calendar" ||
        parsed.viewMode === "eisenhower")
        ? { viewMode: parsed.viewMode }
        : {}),
    };
  } catch {
    return {};
  }
}

function sortTodos(
  todos: TodoDTO[],
  sortBy: SortOption,
  sortDirection: SortDirection,
): TodoDTO[] {
  const directionFactor = sortDirection === "asc" ? 1 : -1;
  const priorityRank: Record<string, number> = {
    "": 0,
    low: 1,
    medium: 2,
    high: 3,
  };

  return [...todos].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "priority":
        comparison =
          (priorityRank[a.priority ?? ""] ?? 0) -
          (priorityRank[b.priority ?? ""] ?? 0);
        break;
      case "date":
      default:
        comparison = (a.dueDate ?? "9999-12-31").localeCompare(
          b.dueDate ?? "9999-12-31",
        );
        break;
    }

    return comparison * directionFactor;
  });
}

type TodoListProps = {
  mode?: "default" | "archive";
  /** When set, lists and new todos are scoped to this project and the project filter is locked. */
  projectId?: string;
  /** Shown in the locked project filter (e.g. project display name). */
  projectName?: string;
  /** When locked to a project, tints folder icons to match its palette color. */
  projectColorKey?: ColorKey | null;
};

export function TodoList({
  mode = "default",
  projectId,
  projectName,
  projectColorKey,
}: TodoListProps = {}) {
  const t = useTranslations("todos");
  const locale = useLocale();
  const getErrorMessage = useApiErrorMessage();
  const { getProjectById, projects: projectsFromContext } = useProjectsStore();
  const isProjectFilterLocked = Boolean(projectId);

  const [projectFilter, setProjectFilter] = useState(() => projectId ?? "all");

  const effectiveListProjectId = useMemo(
    () => projectId ?? (projectFilter !== "all" ? projectFilter : undefined),
    [projectId, projectFilter],
  );

  const listProjectScopeKey = useMemo(
    () => projectId ?? (projectFilter === "all" ? "" : projectFilter),
    [projectId, projectFilter],
  );

  const todosList = useCallback(
    (query: ListTodosQueryDTO) =>
      apiClient.todos.list(
        effectiveListProjectId
          ? { ...query, projectId: effectiveListProjectId }
          : query,
      ),
    [effectiveListProjectId],
  );

  useEffect(() => {
    if (projectId) return;
    if (projectFilter === "all") return;
    if (!getProjectById(projectFilter)) {
      setProjectFilter("all");
    }
  }, [projectId, projectFilter, getProjectById, projectsFromContext]);
  const hasHydratedSettings = useRef(false);
  /** Bumped per todo id on each toggle or undo so stale in-flight updates skip `mutateAll`. */
  const todoToggleOpGenRef = useRef<Record<string, number>>({});
  const [isSettingsReady, setIsSettingsReady] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [groups, setGroups] = useState<Record<string, boolean>>({});

  const [sortBy, setSortBy] = useState<SortOption>(
    DEFAULT_TODO_LIST_SETTINGS.sortBy,
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    DEFAULT_TODO_LIST_SETTINGS.sortDirection,
  );
  const [viewMode, setViewMode] = useState<ViewMode>(
    DEFAULT_TODO_LIST_SETTINGS.viewMode,
  );
  const [listScope, setListScope] = useState<TodoListScope>("today");

  const [calendarInputDayKey, setCalendarInputDayKey] = useState<string | null>(
    null,
  );
  const [calendarQuickTitle, setCalendarQuickTitle] = useState("");
  const [calendarQuickPriority, setCalendarQuickPriority] = useState<
    "low" | "medium" | "high" | undefined
  >(undefined);

  const [todoPendingDelete, setTodoPendingDelete] = useState<TodoDTO | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const todayDate = format(new Date(), "yyyy-MM-dd");
  const todayStart = startOfDay(new Date());
  const tomorrowDate = format(addDays(todayStart, 1), "yyyy-MM-dd");
  const isOverdueDueDate = (dueDate?: string | null) => {
    if (!dueDate) return false;
    return dueDate < todayDate;
  };
  const weekStartDefault = addDays(todayStart, -1);
  const [calendarWeekStart, setCalendarWeekStart] =
    useState<Date>(weekStartDefault);
  const calendarWeekEnd = addDays(calendarWeekStart, 6);

  const calendarDayTitleFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        weekday: "short",
      }),
    [locale],
  );

  const nextSevenDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        addDays(calendarWeekStart, index),
      ),
    [calendarWeekStart],
  );

  const {
    data: scopedListData,
    isLoading: isLoadingScopedList,
    error: scopedListError,
    mutate: mutateScopedList,
  } = useSWR(
    isSettingsReady &&
      viewMode !== "calendar" &&
      viewMode !== "eisenhower" &&
      listScope !== "all"
      ? [
          "todos",
          "scope",
          listScope,
          todayDate,
          tomorrowDate,
          listProjectScopeKey,
        ]
      : null,
    () => {
      switch (listScope) {
        case "today":
          return todosList({
            dueFrom: todayDate,
            dueTo: todayDate,
            limit: 100,
          });
        case "inbox":
          return todosList({
            completed: false,
            onlyNoDueDate: true,
            limit: 100,
          });
        case "future":
          return todosList({
            completed: false,
            dueFrom: tomorrowDate,
            limit: 100,
          });
        case "overdue":
          return todosList({
            completed: false,
            onlyOverdue: true,
            currentDate: todayDate,
            limit: 100,
          });
        default:
          return todosList({
            dueFrom: todayDate,
            dueTo: todayDate,
            limit: 100,
          });
      }
    },
  );

  const {
    data: calendarActiveData,
    isLoading: isLoadingCalendarActive,
    error: calendarActiveError,
    mutate: mutateCalendarActive,
  } = useSWR(
    isSettingsReady && viewMode === "calendar"
      ? [
          "todos",
          "calendar",
          "week",
          format(calendarWeekStart, "yyyy-MM-dd"),
          format(calendarWeekEnd, "yyyy-MM-dd"),
          listProjectScopeKey,
        ]
      : null,
    () =>
      todosList({
        dueFrom: format(calendarWeekStart, "yyyy-MM-dd"),
        dueTo: format(calendarWeekEnd, "yyyy-MM-dd"),
        limit: 100,
      }),
  );

  const matrixKeyActive = isSettingsReady && viewMode === "eisenhower";

  const {
    data: matrixTodayData,
    isLoading: isLoadingMatrixToday,
    error: matrixTodayError,
    mutate: mutateMatrixToday,
  } = useSWR(
    matrixKeyActive
      ? ["todos", "matrix", "today-active", todayDate, listProjectScopeKey]
      : null,
    () =>
      todosList({
        completed: false,
        dueFrom: todayDate,
        dueTo: todayDate,
        limit: 100,
      }),
  );

  const {
    data: matrixInboxData,
    isLoading: isLoadingMatrixInbox,
    error: matrixInboxError,
    mutate: mutateMatrixInbox,
  } = useSWR(
    matrixKeyActive ? ["todos", "matrix", "inbox", listProjectScopeKey] : null,
    () =>
      todosList({
        completed: false,
        onlyNoDueDate: true,
        limit: 100,
      }),
  );

  const {
    data: matrixFutureData,
    isLoading: isLoadingMatrixFuture,
    error: matrixFutureError,
    mutate: mutateMatrixFuture,
  } = useSWR(
    matrixKeyActive
      ? ["todos", "matrix", "future", tomorrowDate, listProjectScopeKey]
      : null,
    () =>
      todosList({
        completed: false,
        dueFrom: tomorrowDate,
        limit: 100,
      }),
  );

  const {
    data: matrixOverdueData,
    isLoading: isLoadingMatrixOverdue,
    error: matrixOverdueError,
    mutate: mutateMatrixOverdue,
  } = useSWR(
    matrixKeyActive
      ? ["todos", "matrix", "overdue", todayDate, listProjectScopeKey]
      : null,
    () =>
      todosList({
        completed: false,
        onlyOverdue: true,
        currentDate: todayDate,
        limit: 100,
      }),
  );

  const listAllScopesActive =
    isSettingsReady &&
    viewMode !== "calendar" &&
    viewMode !== "eisenhower" &&
    listScope === "all";

  const {
    data: listAllTodayData,
    isLoading: isLoadingListAllToday,
    error: listAllTodayError,
    mutate: mutateListAllToday,
  } = useSWR(
    listAllScopesActive
      ? ["todos", "list-all", "today", todayDate, listProjectScopeKey]
      : null,
    () =>
      todosList({
        dueFrom: todayDate,
        dueTo: todayDate,
        limit: 100,
      }),
  );

  const {
    data: listAllInboxData,
    isLoading: isLoadingListAllInbox,
    error: listAllInboxError,
    mutate: mutateListAllInbox,
  } = useSWR(
    listAllScopesActive
      ? ["todos", "list-all", "inbox", listProjectScopeKey]
      : null,
    () =>
      todosList({
        completed: false,
        onlyNoDueDate: true,
        limit: 100,
      }),
  );

  const {
    data: listAllFutureData,
    isLoading: isLoadingListAllFuture,
    error: listAllFutureError,
    mutate: mutateListAllFuture,
  } = useSWR(
    listAllScopesActive
      ? ["todos", "list-all", "future", tomorrowDate, listProjectScopeKey]
      : null,
    () =>
      todosList({
        completed: false,
        dueFrom: tomorrowDate,
        limit: 100,
      }),
  );

  const {
    data: listAllOverdueData,
    isLoading: isLoadingListAllOverdue,
    error: listAllOverdueError,
    mutate: mutateListAllOverdue,
  } = useSWR(
    listAllScopesActive
      ? ["todos", "list-all", "overdue", todayDate, listProjectScopeKey]
      : null,
    () =>
      todosList({
        completed: false,
        onlyOverdue: true,
        currentDate: todayDate,
        limit: 100,
      }),
  );

  const optimisticToggle = (todo: TodoDTO, nowCompleted: boolean) => {
    const updated: TodoDTO = { ...todo, isCompleted: nowCompleted };

    if (viewMode === "calendar") {
      mutateCalendarActive(
        (prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((item) =>
                  item.id === todo.id ? updated : item,
                ),
              }
            : prev,
        false,
      );
      return;
    }

    if (viewMode === "eisenhower") {
      const removeFromToday = (prev: TodosPage | undefined) =>
        prev && todo.dueDate === todayDate
          ? {
              ...prev,
              items: prev.items.filter((t) => t.id !== todo.id),
            }
          : prev;

      if (nowCompleted) {
        mutateMatrixToday(removeFromToday, false);
        mutateMatrixOverdue(
          (prev) =>
            prev
              ? { ...prev, items: prev.items.filter((t) => t.id !== todo.id) }
              : prev,
          false,
        );
        mutateMatrixFuture(
          (prev) =>
            prev
              ? { ...prev, items: prev.items.filter((t) => t.id !== todo.id) }
              : prev,
          false,
        );
        mutateMatrixInbox(
          (prev) =>
            prev
              ? { ...prev, items: prev.items.filter((t) => t.id !== todo.id) }
              : prev,
          false,
        );
      } else {
        mutateMatrixToday(
          (prev) =>
            todo.dueDate === todayDate
              ? prev
                ? {
                    ...prev,
                    items: [
                      updated,
                      ...prev.items.filter((t) => t.id !== todo.id),
                    ],
                  }
                : {
                    items: [updated],
                    meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
                  }
              : prev,
          false,
        );
        mutateMatrixOverdue(
          (prev) =>
            todo.dueDate && isOverdueDueDate(todo.dueDate)
              ? prev
                ? {
                    ...prev,
                    items: [
                      updated,
                      ...prev.items.filter((t) => t.id !== todo.id),
                    ],
                  }
                : {
                    items: [updated],
                    meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
                  }
              : prev,
          false,
        );
        mutateMatrixFuture(
          (prev) =>
            todo.dueDate && todo.dueDate > todayDate
              ? prev
                ? {
                    ...prev,
                    items: [
                      updated,
                      ...prev.items.filter((t) => t.id !== todo.id),
                    ],
                  }
                : {
                    items: [updated],
                    meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
                  }
              : prev,
          false,
        );
        mutateMatrixInbox(
          (prev) =>
            !todo.dueDate
              ? prev
                ? {
                    ...prev,
                    items: [
                      updated,
                      ...prev.items.filter((t) => t.id !== todo.id),
                    ],
                  }
                : {
                    items: [updated],
                    meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
                  }
              : prev,
          false,
        );
      }
      return;
    }

    if (listScope === "all") {
      if (nowCompleted) {
        mutateListAllToday(
          (prev) =>
            prev && todo.dueDate === todayDate
              ? {
                  ...prev,
                  items: prev.items.map((item) =>
                    item.id === todo.id ? updated : item,
                  ),
                }
              : prev,
          false,
        );
        mutateListAllOverdue(
          (prev) =>
            prev
              ? { ...prev, items: prev.items.filter((t) => t.id !== todo.id) }
              : prev,
          false,
        );
        mutateListAllFuture(
          (prev) =>
            prev
              ? { ...prev, items: prev.items.filter((t) => t.id !== todo.id) }
              : prev,
          false,
        );
        mutateListAllInbox(
          (prev) =>
            prev
              ? { ...prev, items: prev.items.filter((t) => t.id !== todo.id) }
              : prev,
          false,
        );
      } else {
        mutateListAllToday(
          (prev) =>
            prev && todo.dueDate === todayDate
              ? {
                  ...prev,
                  items: prev.items.map((item) =>
                    item.id === todo.id ? updated : item,
                  ),
                }
              : prev,
          false,
        );
        mutateListAllOverdue(
          (prev) =>
            todo.dueDate && isOverdueDueDate(todo.dueDate)
              ? prev
                ? {
                    ...prev,
                    items: [
                      updated,
                      ...prev.items.filter((t) => t.id !== todo.id),
                    ],
                  }
                : {
                    items: [updated],
                    meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
                  }
              : prev,
          false,
        );
        mutateListAllFuture(
          (prev) =>
            todo.dueDate && todo.dueDate > todayDate
              ? prev
                ? {
                    ...prev,
                    items: [
                      updated,
                      ...prev.items.filter((t) => t.id !== todo.id),
                    ],
                  }
                : {
                    items: [updated],
                    meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
                  }
              : prev,
          false,
        );
        mutateListAllInbox(
          (prev) =>
            !todo.dueDate
              ? prev
                ? {
                    ...prev,
                    items: [
                      updated,
                      ...prev.items.filter((t) => t.id !== todo.id),
                    ],
                  }
                : {
                    items: [updated],
                    meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
                  }
              : prev,
          false,
        );
      }
      return;
    }

    mutateScopedList((prev) => {
      if (!prev) return prev;
      if (listScope === "today") {
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === todo.id ? updated : item,
          ),
        };
      }
      if (nowCompleted) {
        return {
          ...prev,
          items: prev.items.filter((t) => t.id !== todo.id),
        };
      }
      return {
        ...prev,
        items: [updated, ...prev.items.filter((t) => t.id !== todo.id)],
      };
    }, false);
  };

  const todoMatchesListScope = (todo: TodoDTO): boolean => {
    switch (listScope) {
      case "all":
        return false;
      case "today":
        return todo.dueDate === todayDate;
      case "inbox":
        return !todo.dueDate;
      case "future":
        return Boolean(todo.dueDate && todo.dueDate > todayDate);
      case "overdue":
        return Boolean(todo.dueDate && isOverdueDueDate(todo.dueDate));
      default:
        return false;
    }
  };

  const optimisticCreate = (todo: TodoDTO) => {
    const prepend = (prev: TodosPage | undefined): TodosPage =>
      prev
        ? { ...prev, items: [todo, ...prev.items] }
        : {
            items: [todo],
            meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
          };

    if (viewMode === "eisenhower") {
      if (!todo.dueDate) {
        mutateMatrixInbox(prepend, false);
      } else if (isOverdueDueDate(todo.dueDate)) {
        mutateMatrixOverdue(prepend, false);
      } else if (todo.dueDate > todayDate) {
        mutateMatrixFuture(prepend, false);
      } else {
        mutateMatrixToday(prepend, false);
      }
    } else if (listScope === "all") {
      if (!todo.dueDate) {
        mutateListAllInbox(prepend, false);
      } else if (isOverdueDueDate(todo.dueDate)) {
        mutateListAllOverdue(prepend, false);
      } else if (todo.dueDate > todayDate) {
        mutateListAllFuture(prepend, false);
      } else {
        mutateListAllToday(prepend, false);
      }
    } else if (todoMatchesListScope(todo)) {
      mutateScopedList(prepend, false);
    }
    mutateCalendarActive(
      (prev) =>
        prev
          ? { ...prev, items: [todo, ...prev.items] }
          : {
              items: [todo],
              meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
            },
      false,
    );
  };

  const rollbackOptimisticCreate = (id: string) => {
    const removeById = (prev: TodosPage | undefined) =>
      prev
        ? { ...prev, items: prev.items.filter((todo) => todo.id !== id) }
        : prev;

    mutateScopedList(removeById, false);
    mutateMatrixToday(removeById, false);
    mutateMatrixInbox(removeById, false);
    mutateMatrixFuture(removeById, false);
    mutateMatrixOverdue(removeById, false);
    mutateListAllToday(removeById, false);
    mutateListAllInbox(removeById, false);
    mutateListAllFuture(removeById, false);
    mutateListAllOverdue(removeById, false);
    mutateCalendarActive(
      (prev) =>
        prev
          ? { ...prev, items: prev.items.filter((todo) => todo.id !== id) }
          : prev,
      false,
    );
  };

  const optimisticDelete = (todo: TodoDTO) => {
    const removeFrom = (prev: TodosPage | undefined) =>
      prev
        ? {
            ...prev,
            items: prev.items.filter((item) => item.id !== todo.id),
          }
        : prev;

    mutateScopedList(removeFrom, false);
    mutateMatrixToday(removeFrom, false);
    mutateMatrixInbox(removeFrom, false);
    mutateMatrixFuture(removeFrom, false);
    mutateMatrixOverdue(removeFrom, false);
    mutateListAllToday(removeFrom, false);
    mutateListAllInbox(removeFrom, false);
    mutateListAllFuture(removeFrom, false);
    mutateListAllOverdue(removeFrom, false);
    mutateCalendarActive(removeFrom, false);
  };

  const rollbackOptimisticDelete = (todo: TodoDTO) => {
    const addBack = (prev: TodosPage | undefined) =>
      prev
        ? {
            ...prev,
            items: [todo, ...prev.items.filter((item) => item.id !== todo.id)],
          }
        : {
            items: [todo],
            meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
          };

    mutateScopedList(addBack, false);
    mutateMatrixToday(addBack, false);
    mutateMatrixInbox(addBack, false);
    mutateMatrixFuture(addBack, false);
    mutateMatrixOverdue(addBack, false);
    mutateListAllToday(addBack, false);
    mutateListAllInbox(addBack, false);
    mutateListAllFuture(addBack, false);
    mutateListAllOverdue(addBack, false);
    mutateCalendarActive(addBack, false);
  };

  const optimisticUpdateTodo = (todo: TodoDTO, patch: Partial<TodoDTO>) => {
    const updated: TodoDTO = { ...todo, ...patch };

    const updatePage = (prev: TodosPage | undefined) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((item) =>
              item.id === todo.id ? updated : item,
            ),
          }
        : prev;

    mutateScopedList(updatePage, false);
    mutateMatrixToday(updatePage, false);
    mutateMatrixInbox(updatePage, false);
    mutateMatrixFuture(updatePage, false);
    mutateMatrixOverdue(updatePage, false);
    mutateListAllToday(updatePage, false);
    mutateListAllInbox(updatePage, false);
    mutateListAllFuture(updatePage, false);
    mutateListAllOverdue(updatePage, false);
    mutateCalendarActive(updatePage, false);
  };

  const rollbackOptimisticUpdate = (todo: TodoDTO) => {
    const updatePage = (prev: TodosPage | undefined) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((item) =>
              item.id === todo.id ? todo : item,
            ),
          }
        : prev;

    mutateScopedList(updatePage, false);
    mutateMatrixToday(updatePage, false);
    mutateMatrixInbox(updatePage, false);
    mutateMatrixFuture(updatePage, false);
    mutateMatrixOverdue(updatePage, false);
    mutateListAllToday(updatePage, false);
    mutateListAllInbox(updatePage, false);
    mutateListAllFuture(updatePage, false);
    mutateListAllOverdue(updatePage, false);
    mutateCalendarActive(updatePage, false);
  };

  const optimisticMoveByDueDate = (
    todo: TodoDTO,
    nextDueDate: string | null,
  ) => {
    const updated: TodoDTO = { ...todo, dueDate: nextDueDate };

    const removeById = (prev: TodosPage | undefined) =>
      prev
        ? {
            ...prev,
            items: prev.items.filter((item) => item.id !== todo.id),
          }
        : prev;

    const addToTop = (prev: TodosPage | undefined) =>
      prev
        ? {
            ...prev,
            items: [
              updated,
              ...prev.items.filter((item) => item.id !== todo.id),
            ],
          }
        : {
            items: [updated],
            meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
          };

    const isCompleted = todo.isCompleted;
    const isTodayDue = Boolean(nextDueDate && nextDueDate === todayDate);
    const isOverdueDue = Boolean(nextDueDate && nextDueDate < todayDate);
    const isFutureDue = Boolean(nextDueDate && nextDueDate > todayDate);
    const isInboxDue = !nextDueDate;

    const stillInScopedList =
      !isCompleted &&
      ((listScope === "today" && isTodayDue) ||
        (listScope === "inbox" && isInboxDue) ||
        (listScope === "future" && isFutureDue) ||
        (listScope === "overdue" && isOverdueDue));

    if (viewMode === "eisenhower") {
      mutateMatrixToday(removeById, false);
      mutateMatrixOverdue(removeById, false);
      mutateMatrixFuture(removeById, false);
      mutateMatrixInbox(removeById, false);

      if (!isCompleted && isTodayDue) {
        mutateMatrixToday(addToTop, false);
      }
      if (!isCompleted && isOverdueDue) {
        mutateMatrixOverdue(addToTop, false);
      }
      if (!isCompleted && isFutureDue) {
        mutateMatrixFuture(addToTop, false);
      }
      if (!isCompleted && isInboxDue) {
        mutateMatrixInbox(addToTop, false);
      }
    } else if (listScope === "all") {
      mutateListAllToday(removeById, false);
      mutateListAllOverdue(removeById, false);
      mutateListAllFuture(removeById, false);
      mutateListAllInbox(removeById, false);

      if (!isCompleted && isTodayDue) {
        mutateListAllToday(addToTop, false);
      }
      if (!isCompleted && isOverdueDue) {
        mutateListAllOverdue(addToTop, false);
      }
      if (!isCompleted && isFutureDue) {
        mutateListAllFuture(addToTop, false);
      }
      if (!isCompleted && isInboxDue) {
        mutateListAllInbox(addToTop, false);
      }
    } else {
      mutateScopedList((prev) => {
        if (!prev) return prev;
        if (!stillInScopedList) {
          return removeById(prev);
        }
        return addToTop(removeById(prev));
      }, false);
    }

    mutateCalendarActive(
      (prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((item) =>
                item.id === todo.id ? updated : item,
              ),
            }
          : prev,
      false,
    );
  };

  useEffect(() => {
    const storedSettings = readStoredTodoListSettings();
    const base = { ...DEFAULT_TODO_LIST_SETTINGS, ...storedSettings };

    const nextSettings: TodoListSettings = {
      sortBy: base.sortBy,
      sortDirection: base.sortDirection,
      viewMode: base.viewMode,
    };

    setSortBy(nextSettings.sortBy);
    setSortDirection(nextSettings.sortDirection);
    setViewMode(nextSettings.viewMode);
    hasHydratedSettings.current = true;
    setIsSettingsReady(true);
  }, []);

  useEffect(() => {
    if (!isSettingsReady || !hasHydratedSettings.current) return;

    if (typeof window === "undefined") return;

    const nextSettings: TodoListSettings = {
      sortBy,
      sortDirection,
      viewMode,
    };
    window.localStorage.setItem(
      TODO_SETTINGS_STORAGE_KEY,
      JSON.stringify(nextSettings),
    );
  }, [isSettingsReady, sortBy, sortDirection, viewMode]);

  const mutateAll = () =>
    Promise.all([
      mutateScopedList(),
      mutateMatrixToday(),
      mutateMatrixInbox(),
      mutateMatrixFuture(),
      mutateMatrixOverdue(),
      mutateListAllToday(),
      mutateListAllInbox(),
      mutateListAllFuture(),
      mutateListAllOverdue(),
      mutateCalendarActive(),
    ]);

  const handleCreate = async (values: {
    title: string;
    priority?: "low" | "medium" | "high";
    dueDate?: string;
    projectId?: string | null;
  }) => {
    const resolvedProjectId = projectId ?? values.projectId ?? null;
    const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const now = new Date().toISOString();

    const optimisticTodo: TodoDTO = {
      id: tempId,
      userId: "optimistic",
      title: values.title,
      projectId: resolvedProjectId,
      checklist: [],
      isCompleted: false,
      priority: values.priority ?? null,
      dueDate: values.dueDate ?? null,
      createdAt: now,
      updatedAt: now,
    };

    optimisticCreate(optimisticTodo);
    toast.success(t("messages.todoCreated"));

    try {
      await apiClient.todos.create({
        ...values,
        projectId: resolvedProjectId,
      });
      await mutateAll();
    } catch (error) {
      rollbackOptimisticCreate(tempId);
      toast.error(getErrorMessage(error));
      return;
    }
  };

  const bumpTodoToggleOpGen = (todoId: string) => {
    const next = (todoToggleOpGenRef.current[todoId] ?? 0) + 1;
    todoToggleOpGenRef.current[todoId] = next;
    return next;
  };

  const handleToggle = async (todo: TodoDTO) => {
    const nowCompleted = !todo.isCompleted;
    const opGen = bumpTodoToggleOpGen(todo.id);

    optimisticToggle(todo, nowCompleted);

    let completionToastId: string | undefined;

    if (nowCompleted) {
      completionToastId = toast.success(
        (toastItem) => (
          <span className="flex w-full max-w-70 items-center gap-2 sm:max-w-xs">
            <span className="min-w-0 flex-1 text-sm leading-snug">
              {t("messages.todoCompleted")}
            </span>
            <button
              type="button"
              aria-label={t("messages.undo")}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-inherit opacity-80 transition-opacity hover:bg-foreground/10 hover:opacity-100"
              onClick={() => {
                toast.dismiss(toastItem.id);
                bumpTodoToggleOpGen(todo.id);
                optimisticToggle(todo, todo.isCompleted);
                void (async () => {
                  try {
                    await apiClient.todos.update(todo.id, {
                      isCompleted: todo.isCompleted,
                    });
                    await mutateAll();
                  } catch (error) {
                    optimisticToggle(todo, nowCompleted);
                    toast.error(getErrorMessage(error));
                    return;
                  }
                })();
              }}
            >
              <Undo2 className="size-4" aria-hidden />
            </button>
          </span>
        ),
        { duration: 2000 },
      );

      const audio = new Audio("/check.mp3");
      audio.volume = 0.1;
      void audio.play().catch(() => {});
    }

    try {
      await apiClient.todos.update(todo.id, {
        isCompleted: nowCompleted,
      });
    } catch (error) {
      optimisticToggle(todo, !nowCompleted);
      if (completionToastId) {
        toast.remove(completionToastId);
      }
      toast.error(getErrorMessage(error));
      return;
    }

    if (todoToggleOpGenRef.current[todo.id] !== opGen) {
      return;
    }

    await mutateAll();
  };

  const handleRename = async (todo: TodoDTO, nextTitle: string) => {
    optimisticUpdateTodo(todo, { title: nextTitle });

    try {
      await apiClient.todos.update(todo.id, { title: nextTitle });
      await mutateAll();
    } catch (error) {
      rollbackOptimisticUpdate(todo);
      toast.error(getErrorMessage(error));
    }
  };

  const handleUpdatePriority = async (
    todo: TodoDTO,
    priority?: "low" | "medium" | "high" | null,
  ) => {
    optimisticUpdateTodo(todo, { priority: priority ?? null });

    const priorityLabel =
      priority === "high"
        ? t("groups.high")
        : priority === "medium"
          ? t("groups.medium")
          : t("groups.low");

    const toastId = toast.success(
      priority
        ? t("messages.prioritySet", {
            priority: priorityLabel,
          })
        : t("messages.priorityNoneSelected"),
    );

    try {
      await apiClient.todos.update(todo.id, { priority });
      await mutateAll();
    } catch (error) {
      rollbackOptimisticUpdate(todo);
      toast.dismiss(toastId);
      toast.error(getErrorMessage(error));
    }
  };

  const handleMoveTodo = async (todo: TodoDTO, targetDueDate: Date) => {
    const nextDueDate = toDateOnlyString(startOfDay(targetDueDate));
    await handleUpdateDueDate(todo, nextDueDate);
  };

  const handleUpdateDueDate = async (
    todo: TodoDTO,
    dueDate?: string | null,
  ) => {
    optimisticMoveByDueDate(todo, dueDate ?? null);

    try {
      await apiClient.todos.update(todo.id, {
        dueDate: dueDate ?? null,
      });
      await mutateAll();
    } catch (error) {
      rollbackOptimisticUpdate(todo);
      toast.error(getErrorMessage(error));
    }
  };

  const handleUpdateProject = async (
    todo: TodoDTO,
    projectId: string | null,
  ) => {
    optimisticUpdateTodo(todo, { projectId });

    const toastId = toast.success(
      projectId
        ? t("messages.projectLinked", {
            name: getProjectById(projectId)?.name ?? projectId,
          })
        : t("messages.projectUnlinked"),
    );

    try {
      await apiClient.todos.update(todo.id, { projectId });
      await mutateAll();
    } catch (error) {
      rollbackOptimisticUpdate(todo);
      toast.dismiss(toastId);
      toast.error(getErrorMessage(error));
    }
  };

  const handleUpdateChecklist = async (
    todo: TodoDTO,
    checklist: TodoChecklistItem[],
  ) => {
    const checklistCompletion = resolveCompletionFromChecklist(checklist);
    const patch: Partial<TodoDTO> = { checklist };
    if (checklistCompletion !== null) {
      patch.isCompleted = checklistCompletion;
    }

    optimisticUpdateTodo(todo, patch);

    try {
      await apiClient.todos.update(todo.id, { checklist });
      await mutateAll();
    } catch (error) {
      rollbackOptimisticUpdate(todo);
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!todoPendingDelete || isDeleting) return;
    const deletingTodo = todoPendingDelete;

    optimisticDelete(deletingTodo);
    const successToastId = toast.success(t("messages.taskDeleted"));
    setIsDeleting(true);
    try {
      await apiClient.todos.delete(deletingTodo.id);
      setTodoPendingDelete(null);
      await mutateAll();
    } catch (error) {
      rollbackOptimisticDelete(deletingTodo);
      toast.dismiss(successToastId);
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCalendarQuickCreate = async (day: Date) => {
    const title = calendarQuickTitle.trim();
    if (!title || isCreating) return;
    setIsCreating(true);
    try {
      await handleCreate({
        title,
        ...(calendarQuickPriority ? { priority: calendarQuickPriority } : {}),
        dueDate: toDateOnlyString(startOfDay(day)),
      });
      setCalendarQuickTitle("");
      setCalendarQuickPriority(undefined);
      setCalendarInputDayKey(null);
    } finally {
      setIsCreating(false);
    }
  };

  const scopedItems = useMemo(
    () => sortTodos(scopedListData?.items ?? [], sortBy, sortDirection),
    [scopedListData, sortBy, sortDirection],
  );

  const todayDueTodos = useMemo(() => {
    if (viewMode === "eisenhower") {
      const items = sortTodos(
        matrixTodayData?.items ?? [],
        sortBy,
        sortDirection,
      );
      return items.filter(
        (todo) => todo.dueDate === todayDate && !todo.isCompleted,
      );
    }
    if (listScope === "all") {
      const items = sortTodos(
        listAllTodayData?.items ?? [],
        sortBy,
        sortDirection,
      );
      return items.filter(
        (todo) => todo.dueDate === todayDate && !todo.isCompleted,
      );
    }
    if (listScope !== "today") return [];
    return scopedItems.filter(
      (todo) => todo.dueDate === todayDate && !todo.isCompleted,
    );
  }, [
    viewMode,
    matrixTodayData,
    listAllTodayData,
    sortBy,
    sortDirection,
    todayDate,
    listScope,
    scopedItems,
  ]);

  const inboxTodos = useMemo(() => {
    if (viewMode === "eisenhower") {
      return sortTodos(matrixInboxData?.items ?? [], sortBy, sortDirection);
    }
    if (listScope === "all") {
      return sortTodos(listAllInboxData?.items ?? [], sortBy, sortDirection);
    }
    if (listScope !== "inbox") return [];
    return scopedItems;
  }, [
    viewMode,
    matrixInboxData,
    listAllInboxData,
    sortBy,
    sortDirection,
    listScope,
    scopedItems,
  ]);

  const futureTodos = useMemo(() => {
    if (viewMode === "eisenhower") {
      return sortTodos(matrixFutureData?.items ?? [], sortBy, sortDirection);
    }
    if (listScope === "all") {
      return sortTodos(listAllFutureData?.items ?? [], sortBy, sortDirection);
    }
    if (listScope !== "future") return [];
    return scopedItems;
  }, [
    viewMode,
    matrixFutureData,
    listAllFutureData,
    sortBy,
    sortDirection,
    listScope,
    scopedItems,
  ]);

  const overdueTodos = useMemo(() => {
    if (viewMode === "eisenhower") {
      return sortTodos(matrixOverdueData?.items ?? [], sortBy, sortDirection);
    }
    if (listScope === "all") {
      return sortTodos(listAllOverdueData?.items ?? [], sortBy, sortDirection);
    }
    if (listScope !== "overdue") return [];
    return scopedItems;
  }, [
    viewMode,
    matrixOverdueData,
    listAllOverdueData,
    sortBy,
    sortDirection,
    listScope,
    scopedItems,
  ]);

  const completedTodos = useMemo(() => {
    if (viewMode === "eisenhower") return [];
    if (listScope === "all") {
      const items = sortTodos(
        listAllTodayData?.items ?? [],
        sortBy,
        sortDirection,
      );
      return items.filter(
        (todo) => todo.dueDate === todayDate && todo.isCompleted,
      );
    }
    if (listScope !== "today") return [];
    return scopedItems.filter(
      (todo) => todo.dueDate === todayDate && todo.isCompleted,
    );
  }, [
    viewMode,
    listScope,
    listAllTodayData,
    scopedItems,
    sortBy,
    sortDirection,
    todayDate,
  ]);

  const calendarActiveTodos = useMemo(
    () =>
      sortTodos(
        (calendarActiveData?.items ?? []).filter((todo) => !todo.isCompleted),
        sortBy,
        sortDirection,
      ),
    [calendarActiveData, sortBy, sortDirection],
  );

  const calendarCompletedTodos = useMemo(() => {
    const weekStartKey = format(calendarWeekStart, "yyyy-MM-dd");
    const weekEndKey = format(calendarWeekEnd, "yyyy-MM-dd");
    return sortTodos(
      (calendarActiveData?.items ?? []).filter((todo) => {
        const dueDate = todo.dueDate;
        return Boolean(
          todo.isCompleted &&
          dueDate &&
          dueDate >= weekStartKey &&
          dueDate <= weekEndKey,
        );
      }),
      sortBy,
      sortDirection,
    );
  }, [
    calendarActiveData,
    calendarWeekEnd,
    calendarWeekStart,
    sortBy,
    sortDirection,
  ]);

  const isLoading =
    !isSettingsReady ||
    (viewMode === "calendar"
      ? isLoadingCalendarActive
      : viewMode === "eisenhower"
        ? isLoadingMatrixToday ||
          isLoadingMatrixInbox ||
          isLoadingMatrixFuture ||
          isLoadingMatrixOverdue
        : listScope === "all"
          ? isLoadingListAllToday ||
            isLoadingListAllInbox ||
            isLoadingListAllFuture ||
            isLoadingListAllOverdue
          : isLoadingScopedList);

  const error =
    viewMode === "calendar"
      ? calendarActiveError
      : viewMode === "eisenhower"
        ? (matrixTodayError ??
          matrixInboxError ??
          matrixFutureError ??
          matrixOverdueError)
        : listScope === "all"
          ? (listAllTodayError ??
            listAllInboxError ??
            listAllFutureError ??
            listAllOverdueError)
          : scopedListError;

  const displayGroups = useMemo((): DisplayGroup[] => {
    const groupsList: DisplayGroup[] = [];

    switch (listScope) {
      case "all":
        groupsList.push({
          key: "overdue",
          title: t("groups.overdue"),
          todos: overdueTodos,
        });
        groupsList.push({
          key: "today",
          title: t("groups.today"),
          todos: todayDueTodos,
        });
        groupsList.push({
          key: "future",
          title: t("groups.future"),
          todos: futureTodos,
        });
        groupsList.push({
          key: "inbox",
          title: t("groups.inbox"),
          todos: inboxTodos,
        });
        if (completedTodos.length > 0) {
          groupsList.push({
            key: "completed",
            title: t("groups.completed"),
            todos: completedTodos,
          });
        }
        break;
      case "overdue":
        groupsList.push({
          key: "overdue",
          title: t("groups.overdue"),
          todos: overdueTodos,
        });
        break;
      case "today":
        groupsList.push({
          key: "today",
          title: t("groups.today"),
          todos: todayDueTodos,
        });
        if (completedTodos.length > 0) {
          groupsList.push({
            key: "completed",
            title: t("groups.completed"),
            todos: completedTodos,
          });
        }
        break;
      case "future":
        groupsList.push({
          key: "future",
          title: t("groups.future"),
          todos: futureTodos,
        });
        break;
      case "inbox":
        groupsList.push({
          key: "inbox",
          title: t("groups.inbox"),
          todos: inboxTodos,
        });
        break;
      default:
        break;
    }

    return groupsList.filter((group) => group.todos.length > 0);
  }, [
    listScope,
    todayDueTodos,
    completedTodos,
    futureTodos,
    inboxTodos,
    overdueTodos,
    t,
  ]);

  const emptyListKanbanMessage = useMemo(() => t("messages.noTasks"), [t]);

  const matrixActiveCount = useMemo(
    () =>
      overdueTodos.length +
      todayDueTodos.length +
      futureTodos.length +
      inboxTodos.length,
    [
      futureTodos.length,
      inboxTodos.length,
      overdueTodos.length,
      todayDueTodos.length,
    ],
  );

  const selection: TodoSelectionState = useMemo(
    () => ({
      isEnabled: false,
      selectedIds: new Set(),
      onToggle: () => {},
    }),
    [],
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-3xl tracking-tight sm:text-4xl">
            {mode === "archive" ? "الملاحظات المأرشفه" : t("title")}
          </CardTitle>
          <CardDescription className="max-w-[44ch] text-pretty">
            {t("description")}
          </CardDescription>
        </div>
        <div className="w-full min-w-0 max-w-full sm:w-auto sm:shrink-0">
          <TodoListControls
            viewMode={viewMode}
            sortBy={sortBy}
            sortDirection={sortDirection}
            listScope={listScope}
            projectFilter={projectFilter}
            projectFilterLocked={isProjectFilterLocked}
            lockedView={undefined}
            lockedProjectLabel={
              projectId
                ? [
                    projectName ?? getProjectById(projectId)?.name ?? projectId,
                    getProjectById(projectId)?.icon ?? null,
                  ]
                    .filter(Boolean)
                    .join(" ")
                : projectName
            }
            lockedProjectColorKey={projectColorKey}
            onChangeView={setViewMode}
            onChangeSort={setSortBy}
            onChangeSortDirection={setSortDirection}
            onChangeListScope={setListScope}
            onChangeProjectFilter={
              isProjectFilterLocked ? () => {} : setProjectFilter
            }
          />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <TodoListCreateForm
          onCreate={handleCreate}
          fixedProjectId={projectId}
          fixedProjectName={projectName}
          fixedProjectColorKey={projectColorKey}
          defaultProjectId={
            projectId || (projectFilter !== "all" ? projectFilter : undefined)
          }
          defaultDueDate={listScope === "today" ? todayStart : undefined}
        />

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {t("messages.failedToLoad")}
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 w-full rounded-xl bg-muted" />
            ))}
          </div>
        ) : viewMode === "eisenhower" && matrixActiveCount === 0 ? (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
            {emptyListKanbanMessage}
          </div>
        ) : viewMode !== "calendar" &&
          viewMode !== "eisenhower" &&
          displayGroups.length === 0 ? (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
            {emptyListKanbanMessage}
          </div>
        ) : (
          <>
            {viewMode === "kanban" ? (
              <TodoListViewKanban
                displayGroups={displayGroups}
                groups={groups}
                setGroups={setGroups}
                onToggle={handleToggle}
                onRename={handleRename}
                onUpdatePriority={handleUpdatePriority}
                onUpdateDueDate={handleUpdateDueDate}
                onUpdateProject={handleUpdateProject}
                onUpdateChecklist={handleUpdateChecklist}
                onRequestDelete={(todo) => setTodoPendingDelete(todo)}
              />
            ) : viewMode === "calendar" ? (
              <TodoListViewCalendar
                calendarWeekStart={calendarWeekStart}
                setCalendarWeekStart={setCalendarWeekStart}
                weekStartDefault={weekStartDefault}
                nextSevenDays={nextSevenDays}
                calendarDayTitleFormatter={calendarDayTitleFormatter}
                todayDate={todayDate}
                calendarInputDayKey={calendarInputDayKey}
                setCalendarInputDayKey={setCalendarInputDayKey}
                calendarQuickTitle={calendarQuickTitle}
                setCalendarQuickTitle={setCalendarQuickTitle}
                calendarQuickPriority={calendarQuickPriority}
                setCalendarQuickPriority={setCalendarQuickPriority}
                isCreating={isCreating}
                onCalendarQuickCreate={handleCalendarQuickCreate}
                calendarActiveTodos={calendarActiveTodos}
                calendarCompletedTodos={calendarCompletedTodos}
                onToggle={handleToggle}
                onRename={handleRename}
                onUpdatePriority={handleUpdatePriority}
                onUpdateDueDate={handleUpdateDueDate}
                onUpdateProject={handleUpdateProject}
                onUpdateChecklist={handleUpdateChecklist}
                onRequestDelete={(todo) => setTodoPendingDelete(todo)}
                onMoveTodo={handleMoveTodo}
                groups={groups}
                setGroups={setGroups}
              />
            ) : viewMode === "eisenhower" ? (
              <TodoListViewEisenhower
                todayDueTodos={todayDueTodos}
                overdueTodos={overdueTodos}
                futureTodos={futureTodos}
                inboxTodos={inboxTodos}
                groups={groups}
                setGroups={setGroups}
                onToggle={handleToggle}
                onRename={handleRename}
                onUpdatePriority={handleUpdatePriority}
                onUpdateDueDate={handleUpdateDueDate}
                onUpdateProject={handleUpdateProject}
                onUpdateChecklist={handleUpdateChecklist}
                onRequestDelete={(todo) => setTodoPendingDelete(todo)}
              />
            ) : (
              <TodoListViewList
                displayGroups={displayGroups}
                groups={groups}
                setGroups={setGroups}
                onToggle={handleToggle}
                onRename={handleRename}
                onUpdatePriority={handleUpdatePriority}
                onUpdateDueDate={handleUpdateDueDate}
                onUpdateProject={handleUpdateProject}
                onUpdateChecklist={handleUpdateChecklist}
                onRequestDelete={(todo) => setTodoPendingDelete(todo)}
                selection={selection}
              />
            )}
          </>
        )}
      </CardContent>

      <ConfirmationDialog
        isOpen={Boolean(todoPendingDelete)}
        onClose={() => {
          if (!isDeleting) setTodoPendingDelete(null);
        }}
        onConfirm={() => {
          void handleDelete();
        }}
        title={t("deleteDialog.title")}
        description={t("deleteDialog.description", {
          title: todoPendingDelete?.title ?? t("deleteDialog.fallbackTitle"),
        })}
        confirmText={
          isDeleting ? t("deleteDialog.deleting") : t("deleteDialog.confirm")
        }
        cancelText={t("deleteDialog.cancel")}
        confirmVariant="destructive"
      />
    </Card>
  );
}
