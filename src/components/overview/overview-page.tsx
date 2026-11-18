"use client";

import { useTranslations } from "next-intl";
import {  Clock3 } from "lucide-react";
import { OverviewWelcomeCard } from "@/components/overview/overview-welcome-card";

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
  const t = useTranslations("dashboard");


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

      <div
        className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm"
        role="status"
      >
        <Clock3
          className="mt-0.5 size-5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            {t("overview.accountVerification.title")}
          </p>
          <p className="leading-relaxed text-muted-foreground">
            {t("overview.accountVerification.description")}
          </p>
        </div>
      </div>

    </div>
  );
};

export default OverviewPage;
