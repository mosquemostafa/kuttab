"use client";

import { useTranslations } from "next-intl";
import { Settings, HelpCircle } from "lucide-react";
import { OverviewWelcomeCard } from "@/components/overview/overview-welcome-card";
import {
  OverviewQuickNav,
  type QuickActionItem,
} from "@/components/overview/overview-quick-nav";

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

  const quickActions: QuickActionItem[] = [
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
    </div>
  );
};

export default OverviewPage;
