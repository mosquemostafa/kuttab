"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { FolderOpen, ListChecks, Settings, HelpCircle } from "lucide-react";
import useSWR from "swr";

import { useApiErrorMessage } from "@/lib/api/use-api-error-message";
import { TodayTodosCard } from "@/components/overview/today-todos-card";
import { MainQuickCaptureBar } from "@/components/overview/main-quick-capture-bar";
import { OverviewWelcomeCard } from "@/components/overview/overview-welcome-card";
import {
  OverviewQuickNav,
  type QuickActionItem,
} from "@/components/overview/overview-quick-nav";
import { apiClient } from "@/lib/api/api-client";
import type { TodoDTO } from "@/shared/types/todo.types";

type TodosPage = {
  items: TodoDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type OverviewPageProps = {
  greetingLabels: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  motivationalNotes: string[];
  userImage: string | null;
  userName: string;
  todayValue: string;
  hijriValue?: string;
};

const OverviewPage = ({
  greetingLabels,
  userImage,
  userName,
  motivationalNotes,
  todayValue,
  hijriValue,
}: OverviewPageProps) => {
  const t = useTranslations();

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const getErrorMessage = useApiErrorMessage();

  const {
    data: todayTodosData,
    error: todayTodosError,
    isLoading: isLoadingTodayTodos,
    mutate: mutateTodayTodos,
  } = useSWR<TodosPage>(["overview", "todos", todayKey], () =>
    apiClient.todos.list({
      dueFrom: todayKey,
      dueTo: todayKey,
      limit: 50,
    }),
  );

  const todayTodos = useMemo(
    () =>
      (todayTodosData?.items ?? []).filter((todo) => todo.dueDate === todayKey),
    [todayTodosData, todayKey],
  );

  const handleToggleTodo = async (todo: TodoDTO) => {
    const nextCompleted = !todo.isCompleted;

    mutateTodayTodos(
      (prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((item) =>
                item.id === todo.id
                  ? { ...item, isCompleted: nextCompleted }
                  : item,
              ),
            }
          : prev,
      false,
    );

    try {
      await apiClient.todos.update(todo.id, {
        isCompleted: nextCompleted,
      });

      if (nextCompleted) {
        toast.success(t("todos.messages.todoCompleted"));
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      await mutateTodayTodos();
    }
  };

  const quickActions: QuickActionItem[] = [
    {
      href: "/dashboard/todos",
      icon: ListChecks,
      title: t("dashboard.shell.todos"),
    },
    {
      href: "/dashboard/projects",
      icon: FolderOpen,
      title: t("dashboard.shell.projects"),
    },
    {
      href: "/dashboard/support",
      icon: HelpCircle,
      title: t("dashboard.shell.support"),
    },
    {
      href: "/dashboard/settings",
      icon: Settings,
      title: t("dashboard.shell.settings"),
    },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <OverviewWelcomeCard
        greetingLabels={greetingLabels}
        motivationalNotes={motivationalNotes}
        userImage={userImage}
        userName={userName}
        todayValue={todayValue}
        hijriValue={hijriValue}
      />

      <OverviewQuickNav items={quickActions} />

      <MainQuickCaptureBar
        onTaskCreated={() => {
          void mutateTodayTodos();
        }}
      />

      <TodayTodosCard
        todos={todayTodos}
        isLoading={isLoadingTodayTodos}
        error={Boolean(todayTodosError)}
        onToggleTodo={handleToggleTodo}
      />
    </div>
  );
};

export default OverviewPage;
