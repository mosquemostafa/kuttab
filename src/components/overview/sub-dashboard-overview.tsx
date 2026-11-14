"use client";

import { useMemo } from "react";

import {
  OverviewWelcomeCard,
  type OverviewWelcomeCardProps,
} from "./overview-welcome-card";
import { OverviewQuickNav, type QuickActionItem } from "./overview-quick-nav";

type SubDashboardOverviewProps = OverviewWelcomeCardProps & {
  quickActions?: QuickActionItem[];
};

export default function SubDashboardOverview({
  greetingLabels,
  motivationalNotes,
  userImage,
  userName,
  todayValue,
  hijriValue,
  quickActions,
}: SubDashboardOverviewProps) {
  const resolvedQuickActions = useMemo<QuickActionItem[]>(() => {
    return quickActions ?? [];
  }, [quickActions]);

  return (
    <div className="flex flex-col gap-6">
      <OverviewWelcomeCard
        greetingLabels={greetingLabels}
        motivationalNotes={motivationalNotes}
        userImage={userImage}
        userName={userName}
        todayValue={todayValue}
        hijriValue={hijriValue}
      />
      {resolvedQuickActions.length > 0 && (
        <OverviewQuickNav items={resolvedQuickActions} />
      )}
    </div>
  );
}
