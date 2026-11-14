"use client";

import {
  ArrowUpDown,
  CalendarPlus,
  CalendarDays,
  Columns3,
  Flame,
  FolderOpen,
  LayoutGrid,
  List,
  Plus,
} from "lucide-react";

import { addDays, addMonths, format, isSameDay, startOfDay } from "date-fns";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectSelect } from "@/components/projects/project-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectsStore } from "@/components/projects/projects-store";
import { cn } from "@/lib/utils";
import { projectColorKeyToIconTextClass } from "@/shared/constants/color-palette";
import { TODO_GROUP_ICON_BY_KEY } from "./todo-group-icon";
import { TodoDueDatePicker } from "./todo-due-date-picker";
import type {
  SortDirection,
  SortOption,
  TodoListScope,
  ViewMode,
} from "./todo-list-types";

interface TodoListControlsProps {
  viewMode: ViewMode;
  sortBy: SortOption;
  sortDirection: SortDirection;
  listScope: TodoListScope;
  projectFilter: string;
  /** When true, project filter shows one project and cannot be changed. */
  projectFilterLocked?: boolean;
  /** When set, view mode is locked to this view (used during Pomodoro selection). */
  lockedView?: ViewMode;
  /** Label for the locked project filter (falls back to raw id). */
  lockedProjectLabel?: string;
  /** When the filter is locked, tints the folder icon to match the project color. */
  lockedProjectColorKey?: string | null;
  onChangeView: (view: ViewMode) => void;
  onChangeSort: (sort: SortOption) => void;
  onChangeSortDirection: (direction: SortDirection) => void;
  onChangeListScope: (scope: TodoListScope) => void;
  onChangeProjectFilter: (project: string) => void;
}

export function TodoListCreateForm({
  onCreate,
  fixedProjectId,
  fixedProjectName,
  fixedProjectColorKey,
  defaultProjectId,
  defaultDueDate,
}: {
  onCreate: (values: {
    title: string;
    priority?: "low" | "medium" | "high";
    dueDate?: string;
    projectId?: string | null;
  }) => Promise<void>;
  /** When set, quick-create is bound to this project and the project picker is hidden. */
  fixedProjectId?: string;
  fixedProjectName?: string;
  fixedProjectColorKey?: string | null;
  defaultProjectId?: string;
  defaultDueDate?: Date;
}) {
  const t = useTranslations("todos");
  const locale = useLocale();
  const { projects: contextProjects, getProjectById } = useProjectsStore();
  const quickTitleRef = useRef<HTMLTextAreaElement>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState<
    "low" | "medium" | "high" | undefined
  >(undefined);
  const [quickProjectId, setQuickProjectId] = useState<string | undefined>(
    fixedProjectId ?? defaultProjectId,
  );

  useEffect(() => {
    if (fixedProjectId) return;
    setQuickProjectId(defaultProjectId ?? undefined);
  }, [defaultProjectId, fixedProjectId]);
  const [quickDueDate, setQuickDueDate] = useState<Date | undefined>(
    defaultDueDate,
  );
  useEffect(() => {
    setQuickDueDate(defaultDueDate);
  }, [defaultDueDate?.getTime()]);
  const [isCreating, setIsCreating] = useState(false);

  const dueDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }),
    [locale],
  );

  const semanticDates = useMemo(() => {
    const today = startOfDay(new Date());
    return {
      today,
      tomorrow: startOfDay(addDays(today, 1)),
      nextWeek: startOfDay(addDays(today, 7)),
      nextMonth: startOfDay(addMonths(today, 1)),
    };
  }, []);

  const dueDateLabel = quickDueDate
    ? isSameDay(quickDueDate, semanticDates.today)
      ? t("labels.today")
      : isSameDay(quickDueDate, semanticDates.tomorrow)
        ? t("labels.tomorrow")
        : isSameDay(quickDueDate, semanticDates.nextWeek)
          ? t("labels.nextWeek")
          : isSameDay(quickDueDate, semanticDates.nextMonth)
            ? t("labels.nextMonth")
            : dueDateFormatter.format(quickDueDate)
    : "";

  const priorityLabel = quickPriority
    ? quickPriority === "high"
      ? t("priority.high")
      : quickPriority === "medium"
        ? t("priority.medium")
        : t("priority.low")
    : "";
  const projectLabel = quickProjectId
    ? (getProjectById(quickProjectId)?.name ?? quickProjectId)
    : "";
  const quickProjectFolderTintClass = quickProjectId
    ? projectColorKeyToIconTextClass(getProjectById(quickProjectId)?.colorKey)
    : undefined;
  const fixedProjectFolderTintClass =
    projectColorKeyToIconTextClass(fixedProjectColorKey);

  const handleQuickCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = quickTitle.trim();
    if (!title || isCreating) return;

    // Optimistic UI: clear input immediately
    setQuickTitle("");
    if (quickTitleRef.current) {
      quickTitleRef.current.style.height = "auto";
    }
    setQuickPriority(undefined);
    setQuickProjectId(undefined);
    setQuickDueDate(defaultDueDate);

    setIsCreating(true);
    try {
      await onCreate({
        title,
        ...(quickPriority ? { priority: quickPriority } : {}),
        ...(quickDueDate
          ? { dueDate: format(startOfDay(quickDueDate), "yyyy-MM-dd") }
          : {}),
        ...(quickProjectId
          ? { projectId: quickProjectId }
          : { projectId: null }),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleTitleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setQuickTitle(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${event.target.scrollHeight}px`;
  };

  const handleTitleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <form
      onSubmit={handleQuickCreate}
      className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2 sm:flex-row sm:items-center"
    >
      <Textarea
        ref={quickTitleRef}
        value={quickTitle}
        onChange={handleTitleChange}
        onKeyDown={handleTitleKeyDown}
        placeholder={t("quickCreate.placeholder")}
        rows={1}
        className="min-h-11 w-full flex-1 resize-none overflow-hidden border-0 bg-transparent px-1 shadow-none focus-visible:bg-transparent focus-visible:ring-0 dark:bg-transparent"
        aria-label={t("aria.newTodoTitle")}
      />

      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size={quickPriority ? "sm" : "icon-sm"}
              className={quickPriority ? "gap-1.5" : undefined}
              aria-label={
                quickPriority
                  ? t("aria.selectedPriority", { priority: quickPriority })
                  : t("aria.selectPriority")
              }
            >
              {quickPriority ? (
                <Badge variant="outline" className="text-foreground">
                  {priorityLabel}
                </Badge>
              ) : (
                <Flame />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setQuickPriority(undefined)}>
              {t("priority.none")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setQuickPriority("high")}>
              {t("priority.high")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setQuickPriority("medium")}>
              {t("priority.medium")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setQuickPriority("low")}>
              {t("priority.low")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {fixedProjectId ? (
          <span
            className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border px-2 py-1 text-sm text-foreground"
            title={fixedProjectName ?? fixedProjectId}
          >
            <FolderOpen
              className={cn(
                "size-4 shrink-0",
                fixedProjectFolderTintClass ??
                  "text-muted-foreground opacity-80",
              )}
              aria-hidden
            />
            <span className="max-w-48 truncate font-medium">
              {fixedProjectName ?? fixedProjectId}
            </span>
          </span>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size={quickProjectId ? "sm" : "icon-sm"}
                className={quickProjectId ? "gap-1.5" : undefined}
                aria-label={
                  quickProjectId
                    ? t("aria.selectedProject", { name: projectLabel })
                    : t("aria.selectProject")
                }
              >
                {quickProjectId ? (
                  <Badge
                    variant="outline"
                    className="max-w-full gap-1.5 text-foreground"
                  >
                    <FolderOpen
                      className={cn(
                        "size-3.5 shrink-0",
                        quickProjectFolderTintClass ?? "text-muted-foreground",
                      )}
                      aria-hidden
                    />
                    <span className="truncate">{projectLabel}</span>
                  </Badge>
                ) : (
                  <FolderOpen className="text-muted-foreground" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="max-h-72 w-56 overflow-y-auto"
            >
              <DropdownMenuItem onClick={() => setQuickProjectId(undefined)}>
                {t("quickCreate.noProject")}
              </DropdownMenuItem>
              {contextProjects.map((p) => {
                const rowTintClass = projectColorKeyToIconTextClass(p.colorKey);
                return (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => setQuickProjectId(p.id)}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <FolderOpen
                        className={cn(
                          "size-4 shrink-0",
                          rowTintClass ?? "text-muted-foreground",
                        )}
                        aria-hidden
                      />
                      <span className="truncate">{p.name}</span>
                    </span>
                  </DropdownMenuItem>
                );
              })}
              {contextProjects.length === 0 ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/projects"
                      className="flex items-center gap-2 rounded-sm px-2 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                    >
                      <Plus className="size-4" aria-hidden />
                      <span>{t("quickCreate.createProject")}</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <TodoDueDatePicker
          value={quickDueDate}
          onSave={(value) => {
            const next = value ? startOfDay(value) : undefined;
            setQuickDueDate(next);
          }}
          align="end"
          trigger={
            <Button
              type="button"
              variant="ghost"
              size={quickDueDate ? "sm" : "icon-sm"}
              className={quickDueDate ? "gap-1.5" : undefined}
              aria-label={
                quickDueDate
                  ? t("aria.selectedDueDate", {
                      date: format(quickDueDate, "yyyy-MM-dd"),
                    })
                  : t("aria.selectDueDate")
              }
            >
              {quickDueDate ? (
                <Badge variant="outline" className="text-foreground">
                  {dueDateLabel}
                </Badge>
              ) : (
                <CalendarPlus />
              )}
            </Button>
          }
        />

        <Button
          type="submit"
          size="icon-sm"
          disabled={isCreating || !quickTitle.trim()}
          aria-label={isCreating ? t("aria.addingTask") : t("aria.addTask")}
          className="text-xl cursor-pointer"
        >
          <Plus />
        </Button>
      </div>
    </form>
  );
}

const SCOPE_OPTIONS: {
  value: TodoListScope;
  labelKey:
    | "scopeAll"
    | "scopeToday"
    | "scopeInbox"
    | "scopeFuture"
    | "scopeOverdue";
  icon: typeof List;
}[] = [
  {
    value: "today",
    labelKey: "scopeToday",
    icon: TODO_GROUP_ICON_BY_KEY.today,
  },
  {
    value: "overdue",
    labelKey: "scopeOverdue",
    icon: TODO_GROUP_ICON_BY_KEY.overdue,
  },
  {
    value: "inbox",
    labelKey: "scopeInbox",
    icon: TODO_GROUP_ICON_BY_KEY.inbox,
  },
  {
    value: "future",
    labelKey: "scopeFuture",
    icon: TODO_GROUP_ICON_BY_KEY.future,
  },

  {
    value: "all",
    labelKey: "scopeAll",
    icon: TODO_GROUP_ICON_BY_KEY.tasks,
  },
];

export function TodoListControls({
  viewMode,
  sortBy,
  sortDirection,
  listScope,
  projectFilter,
  projectFilterLocked = false,
  lockedView,
  lockedProjectLabel,
  lockedProjectColorKey,
  onChangeView,
  onChangeSort,
  onChangeSortDirection,
  onChangeListScope,
  onChangeProjectFilter,
}: TodoListControlsProps) {
  const t = useTranslations("todos");
  const lockedProjectFolderTintClass = projectColorKeyToIconTextClass(
    lockedProjectColorKey,
  );

  const viewLocked = lockedView !== undefined;

  const viewOptions = [
    { value: "list", label: t("view.list"), icon: List },
    { value: "kanban", label: t("view.kanban"), icon: Columns3 },
    { value: "eisenhower", label: t("view.eisenhower"), icon: LayoutGrid },
    { value: "calendar", label: t("view.calendar"), icon: CalendarDays },
  ] as const satisfies ReadonlyArray<{
    value: ViewMode;
    label: string;
    icon: typeof List;
  }>;
  const selectedView = viewOptions.find((option) => option.value === viewMode);
  const scopeSelectLocked =
    viewMode === "calendar" || viewMode === "eisenhower";
  const scopeSelectValue: TodoListScope = scopeSelectLocked ? "all" : listScope;
  const selectedScopeForDisplay = SCOPE_OPTIONS.find(
    (o) => o.value === scopeSelectValue,
  );
  const getScopeLabel = (
    labelKey:
      | "scopeAll"
      | "scopeToday"
      | "scopeInbox"
      | "scopeFuture"
      | "scopeOverdue",
  ) => {
    switch (labelKey) {
      case "scopeToday":
        return t("filters.scopeToday");
      case "scopeOverdue":
        return t("filters.scopeOverdue");
      case "scopeInbox":
        return t("filters.scopeInbox");
      case "scopeFuture":
        return t("filters.scopeFuture");
      case "scopeAll":
      default:
        return t("filters.scopeAll");
    }
  };
  const ascLabel =
    sortBy === "date"
      ? t("filters.oldestToNewest")
      : sortBy === "priority"
        ? t("filters.lowToHigh")
        : t("filters.ascending");
  const descLabel =
    sortBy === "date"
      ? t("filters.newestToOldest")
      : sortBy === "priority"
        ? t("filters.highToLow")
        : t("filters.descending");

  return (
    <div className="flex w-full min-w-0 max-w-full flex-nowrap items-center gap-2 sm:w-auto sm:max-w-none sm:gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("aria.sortTasks")}
            className="shrink-0"
          >
            <ArrowUpDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>{t("filters.sortBy")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={sortBy}
            onValueChange={(value) => onChangeSort(value as SortOption)}
          >
            <DropdownMenuRadioItem value="date">
              {t("filters.date")}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="title">
              {t("filters.title")}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="priority">
              {t("filters.priority")}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>{t("filters.sortDirection")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={sortDirection}
            onValueChange={(value) =>
              onChangeSortDirection(value as SortDirection)
            }
          >
            <DropdownMenuRadioItem value="desc">
              {descLabel}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="asc">
              {ascLabel}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex w-9 min-w-9 shrink-0 xl:w-auto xl:flex-none">
        <Select
          value={viewMode}
          disabled={viewLocked}
          onValueChange={(value) => {
            if (viewLocked) return;
            onChangeView(value as ViewMode);
          }}
        >
          <SelectTrigger
            aria-label={t("view.label")}
            className="h-9 w-9 rounded-xl border-border/60 bg-card/60 px-0 xl:hidden [&>svg]:hidden"
          >
            <span className="flex w-full items-center justify-center">
              {selectedView ? (
                <selectedView.icon className="size-4 shrink-0" />
              ) : (
                <List className="size-4 shrink-0" />
              )}
            </span>
            <SelectValue className="sr-only" />
          </SelectTrigger>
          <SelectContent align="start" className="xl:hidden">
            {viewOptions.map((option) => {
              const Icon = option.icon;

              return (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <Icon className="size-4" />
                    <span>{option.label}</span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <div
          role="group"
          aria-label={t("view.label")}
          className={cn(
            "hidden items-center justify-center gap-1 rounded-xl border border-border/60 bg-card/60 p-1 xl:flex",
            viewLocked && "pointer-events-none opacity-60",
          )}
        >
          <Button
            type="button"
            size="sm"
            variant={viewMode === "list" ? "secondary" : "ghost"}
            onClick={() => onChangeView("list")}
            disabled={viewLocked}
            aria-label={t("view.list")}
            className="h-8 gap-1.5 px-2"
          >
            <List />
            <span>{t("view.list")}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === "kanban" ? "secondary" : "ghost"}
            onClick={() => onChangeView("kanban")}
            disabled={viewLocked}
            aria-label={t("view.kanban")}
            className="h-8 gap-1.5 px-2"
          >
            <Columns3 />
            <span>{t("view.kanban")}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === "eisenhower" ? "secondary" : "ghost"}
            onClick={() => onChangeView("eisenhower")}
            disabled={viewLocked}
            aria-label={t("view.eisenhower")}
            className="h-8 gap-1.5 px-2"
          >
            <LayoutGrid />
            <span>{t("view.eisenhower")}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === "calendar" ? "secondary" : "ghost"}
            onClick={() => onChangeView("calendar")}
            disabled={viewLocked}
            aria-label={t("view.calendar")}
            className="h-8 gap-1.5 px-2"
          >
            <CalendarDays />
            <span>{t("view.calendar")}</span>
          </Button>
        </div>
      </div>

      <div className="flex min-w-0 flex-[45_1_0%] basis-0 sm:max-w-56 sm:w-auto sm:flex-none sm:basis-auto">
        <Select
          value={scopeSelectValue}
          disabled={scopeSelectLocked}
          onValueChange={(value) => {
            if (scopeSelectLocked) return;
            onChangeListScope(value as TodoListScope);
          }}
        >
          <SelectTrigger
            aria-label={
              scopeSelectLocked
                ? t("filters.scopeLockedAria")
                : t("filters.taskScope")
            }
            className="h-9 w-full min-w-0 rounded-xl border-border/60 bg-card/60 max-sm:[&>svg]:hidden sm:[&>svg]:block"
          >
            <SelectValue>
              {selectedScopeForDisplay ? (
                <span className="flex min-w-0 items-center gap-2">
                  <selectedScopeForDisplay.icon className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">
                    {getScopeLabel(selectedScopeForDisplay.labelKey)}
                  </span>
                </span>
              ) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            {SCOPE_OPTIONS.map(({ value, labelKey, icon: Icon }) => (
              <SelectItem key={value} value={value}>
                <span className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0" />
                  <span>{getScopeLabel(labelKey)}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-w-0 flex-[55_1_0%] basis-0 sm:max-w-56 sm:w-auto sm:flex-none sm:basis-auto md:w-42 md:max-w-56">
        {projectFilterLocked ? (
          <Badge
            variant="outline"
            className="h-9 w-full min-w-0 justify-start gap-2 rounded-xl border-border/60 bg-card/60 px-3 text-sm disabled:opacity-100"
            aria-label={t("filters.projectFilterLocked", {
              name: lockedProjectLabel ?? projectFilter,
            })}
          >
            <FolderOpen
              className={cn(
                "size-4 shrink-0",
                lockedProjectFolderTintClass ?? "text-muted-foreground",
              )}
              aria-hidden
            />
            <span className="truncate">
              {lockedProjectLabel ?? projectFilter}
            </span>
          </Badge>
        ) : (
          <ProjectSelect
            value={projectFilter}
            onValueChange={onChangeProjectFilter}
            includeAll
            allLabel={t("filters.allProjects")}
            placeholder={t("filters.projectFilter")}
            className="rounded-xl"
          />
        )}
      </div>
    </div>
  );
}
