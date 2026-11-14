import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  Flame,
  Inbox,
  ListTodo,
  ShieldAlert,
  Sun,
  TimerOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const TODO_GROUP_ICON_BY_KEY: Record<string, LucideIcon> = {
  overdue: CalendarClock,
  today: Sun,
  future: CalendarDays,
  inbox: Inbox,
  completed: CheckCircle2,
  tasks: ListTodo,
  "urgent-important": ShieldAlert,
  "urgent-not-important": AlertCircle,
  "not-urgent-important": Flame,
  "not-urgent-not-important": TimerOff,
};

export function TodoGroupIcon({
  groupKey,
  className,
}: {
  groupKey: string;
  className?: string;
}) {
  const Icon = TODO_GROUP_ICON_BY_KEY[groupKey] ?? ListTodo;

  return (
    <Icon
      className={cn("text-muted-foreground", className)}
      aria-hidden="true"
    />
  );
}
