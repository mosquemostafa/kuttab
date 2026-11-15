"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

export type OverviewWelcomeCardProps = {
  greetingLabels: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  motivationalNotes: string[];
  userImage?: string | null;
  userName: string;
  todayValue: string;
  hijriValue?: string;
};

export function OverviewWelcomeCard({
  greetingLabels,
  motivationalNotes,
  userImage,
  userName,
  todayValue,
  hijriValue,
}: OverviewWelcomeCardProps) {
  const userInitial = userName.trim().charAt(0).toUpperCase() || "U";
  const userFirstName = userName.trim().split(/\s+/)[0] || userName;
  const [greeting, setGreeting] = useState<string | null>(null);
  const [selectedMotivationalNote, setSelectedMotivationalNote] = useState("");

  useEffect(() => {
    if (!motivationalNotes || motivationalNotes.length === 0) return;
    const index = Math.floor(Math.random() * motivationalNotes.length);
    setSelectedMotivationalNote(motivationalNotes[index] ?? "");
  }, [motivationalNotes]);

  useEffect(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      setGreeting(greetingLabels.morning);
      return;
    }

    if (hour < 18) {
      setGreeting(greetingLabels.afternoon);
      return;
    }

    setGreeting(greetingLabels.evening);
  }, [greetingLabels]);

  return (
    <Card className="border bg-linear-to-br from-primary/15 via-background to-muted/60 shadow-sm relative overflow-hidden">
      <CardContent className="p-3.5 sm:p-6 lg:p-8">
        <div className="flex items-start justify-between gap-3 lg:items-end">
          <div className="min-w-0 flex-1 space-y-1 sm:space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1 text-2xs sm:text-xs font-medium uppercase tracking-wider sm:tracking-[0.2em] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays
                  className="size-3 shrink-0 text-primary"
                  aria-hidden
                />
                <span className="truncate">{todayValue}</span>
              </span>

              {hijriValue && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="truncate" dir="rtl">
                    {hijriValue}
                  </span>
                </>
              )}
            </div>
            <CardTitle className="flex flex-wrap items-baseline gap-x-2 gap-y-1 truncate text-xl font-semibold tracking-tight leading-snug sm:text-3xl lg:text-4xl sm:leading-loose">
              <span className="text-xs sm:text-base font-medium uppercase tracking-wider sm:tracking-[0.2em] text-muted-foreground">
                {greeting ?? "\u00A0"}
              </span>
              <span>{userFirstName}</span>
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed sm:text-base sm:leading-6 line-clamp-2 sm:line-clamp-none font-medium text-foreground/85">
              {selectedMotivationalNote}
            </CardDescription>
          </div>

          <Avatar className="size-11 sm:size-16 lg:size-20 shrink-0 border bg-background shadow-sm">
            <AvatarImage src={userImage || undefined} alt={userName} />
            <AvatarFallback className="text-sm sm:text-lg font-semibold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Decorative Islamic Star Watermark */}
        <div
          className="pointer-events-none absolute -bottom-8 -end-8 opacity-4 dark:opacity-8 text-primary select-none"
          aria-hidden="true"
        >
          <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L13.2 4.3L15.6 3.6L15.9 6.2L18.4 6.8L17.5 9.2L19.5 10.9L17.7 12.8L18.8 15.1L16.3 16L15.9 18.5L13.4 18.2L12 20.3L10.6 18.2L8.1 18.5L7.7 16L5.2 15.1L6.3 12.8L4.5 10.9L6.5 9.2L5.6 6.8L8.1 6.2L8.4 3.6L10.8 4.3L12 2Z" />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
