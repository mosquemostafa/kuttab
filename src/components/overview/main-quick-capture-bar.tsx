"use client";

import { useState } from "react";
import { CheckSquare } from "lucide-react";
import { useTranslations } from "next-intl";

import { QuickTaskDialog } from "@/components/overview/quick-task-dialog";

type MainQuickCaptureBarProps = {
  onTaskCreated?: () => void;
};

export function MainQuickCaptureBar({
  onTaskCreated,
}: MainQuickCaptureBarProps) {
  const t = useTranslations("dashboard.overview.quickCapture");
  const [isTaskOpen, setIsTaskOpen] = useState(false);

  const handleTaskSuccess = () => {
    onTaskCreated?.();
  };

  return (
    <>
      <div className="w-full">
        {/* Quick Task Card */}
        <button
          type="button"
          onClick={() => setIsTaskOpen(true)}
          className="group relative flex w-full items-center gap-3 rounded-xl sm:rounded-2xl border border-border/70 bg-card/80 p-3 sm:p-4 text-start shadow-xs transition-all duration-200 hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:shadow-sm active:scale-[0.99]"
        >
          <div className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-105 dark:text-emerald-400">
            <CheckSquare className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              {t("addTask")}
            </span>
            <span className="hidden sm:block truncate text-xs text-muted-foreground">
              {t("addTaskDesc")}
            </span>
          </div>
        </button>
      </div>

      <QuickTaskDialog
        open={isTaskOpen}
        onOpenChange={setIsTaskOpen}
        onSuccess={handleTaskSuccess}
      />
    </>
  );
}
