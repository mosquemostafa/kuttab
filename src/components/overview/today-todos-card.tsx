"use client";

import { useTranslations } from "next-intl";
import {
  Loader2,
  Square,
  CheckSquare,
  ListTodo,
  ArrowRight,
  ListChecks,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { TodoDTO } from "@/shared/types/todo.types";

type TodayTodosCardProps = {
  todos: TodoDTO[];
  isLoading: boolean;
  error: boolean;
  onToggleTodo: (todo: TodoDTO) => Promise<void>;
};

export function TodayTodosCard({
  todos,
  isLoading,
  error,
  onToggleTodo,
}: TodayTodosCardProps) {
  const t = useTranslations("todos");

  const sortedTodos = [...todos].sort((a, b) => {
    if (a.isCompleted === b.isCompleted) return 0;
    return a.isCompleted ? 1 : -1;
  });

  return (
    <Card className="border border-border/60 bg-card/80 shadow-sm rounded-xl sm:rounded-2xl">
      <CardContent className="p-3.5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight sm:text-lg">
            <ListChecks className="size-4 sm:size-5 text-primary" />
            {t("groups.today")}
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isLoading && !error && todos.length > 0 && (
              <Link
                href="/dashboard/todos"
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("actions.viewAll")}
                <ArrowRight className="size-3" />
              </Link>
            )}
            <Badge
              variant="secondary"
              className="shrink-0 rounded-full px-2.5 py-0.5 text-xs"
            >
              {todos.length}
            </Badge>
          </div>
        </div>
        {error ? (
          <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {t("messages.failedToLoad")}
          </div>
        ) : isLoading ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
          </div>
        ) : todos.length === 0 ? (
          <Link
            href="/dashboard/todos"
            className="group mt-3 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-center transition-colors hover:border-border hover:bg-muted/40"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-muted/60 transition-colors group-hover:bg-muted">
              <ListTodo className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                {t("messages.noTasks")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("messages.addFirstTask")}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors group-hover:bg-primary/15">
              {t("actions.goToTodos")}
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ) : (
          <div className="mt-3 max-h-36 space-y-1.5 overflow-y-auto pr-0.5 sm:max-h-44">
            {sortedTodos.map((todo) => (
              <div
                key={todo.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border border-border/60 p-2 sm:p-2.5 shadow-sm transition-colors",
                  todo.isCompleted
                    ? "bg-muted/10 opacity-60"
                    : "bg-background/80 hover:bg-muted/40",
                )}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    void onToggleTodo(todo);
                  }}
                  aria-label={t("aria.markAsDone")}
                  className="shrink-0"
                >
                  {todo.isCompleted ? (
                    <CheckSquare className="text-primary" />
                  ) : (
                    <Square className="text-muted-foreground" />
                  )}
                </Button>
                <p
                  className={cn(
                    "min-w-0 flex-1 truncate text-sm leading-5",
                    todo.isCompleted
                      ? "text-muted-foreground line-through"
                      : "font-medium text-foreground",
                  )}
                >
                  {todo.title}
                </p>
                {(todo.checklist ?? []).length > 0 ? (
                  <Badge
                    variant="secondary"
                    className="shrink-0 px-1.5 text-[10px]"
                  >
                    {t("checklist.progress", {
                      completed: (todo.checklist ?? []).filter(
                        (item) => item.isCompleted,
                      ).length,
                      total: (todo.checklist ?? []).length,
                    })}
                  </Badge>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
