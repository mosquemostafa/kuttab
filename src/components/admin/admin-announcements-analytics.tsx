"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { useLocale, useTranslations } from "next-intl";
import { Cell, Pie, PieChart } from "recharts";

import { apiClient } from "@/lib/api/api-client";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ChartCard({
  title,
  description,
  emptyLabel,
  data,
  config,
  nameKey,
}: {
  title: string;
  description: string;
  emptyLabel: string;
  data: Array<Record<string, string | number>>;
  config: ChartConfig;
  nameKey: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-2">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ChartContainer
            config={config}
            className="mx-auto aspect-square w-full max-w-sm"
          >
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent hideLabel nameKey={nameKey} />}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey={nameKey}
                innerRadius={56}
                strokeWidth={2}
              >
                {data.map((entry) => (
                  <Cell
                    key={String(entry[nameKey])}
                    fill={`var(--color-${String(entry[nameKey])})`}
                  />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey={nameKey} />}
                className="-translate-y-2 flex-wrap gap-2"
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminAnnouncementsAnalytics() {
  const t = useTranslations();
  const locale = useLocale();

  const { data, error, isLoading } = useSWR(
    "admin-announcements-analytics",
    () => apiClient.adminAnnouncements.analytics(),
    { revalidateOnFocus: false },
  );

  const formattedAsOf = useMemo(() => {
    if (!data?.generatedAt) return null;
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(data.generatedAt));
  }, [data?.generatedAt, locale]);

  const typeConfig = useMemo(
    () =>
      ({
        feature: {
          label: t("adminAnnouncements.types.feature"),
          color: "var(--chart-1)",
        },
        improvement: {
          label: t("adminAnnouncements.types.improvement"),
          color: "var(--chart-2)",
        },
        fix: {
          label: t("adminAnnouncements.types.fix"),
          color: "var(--chart-3)",
        },
        maintenance: {
          label: t("adminAnnouncements.types.maintenance"),
          color: "var(--chart-4)",
        },
        alert: {
          label: t("adminAnnouncements.types.alert"),
          color: "var(--chart-5)",
        },
        promotion: {
          label: t("adminAnnouncements.types.promotion"),
          color: "var(--chart-1)",
        },
      }) satisfies ChartConfig,
    [t],
  );

  const activeConfig = useMemo(
    () =>
      ({
        active: {
          label: t("adminAnnouncements.analytics.active"),
          color: "var(--chart-3)",
        },
        notActive: {
          label: t("adminAnnouncements.analytics.notActive"),
          color: "var(--chart-5)",
        },
      }) satisfies ChartConfig,
    [t],
  );

  const statusConfig = useMemo(
    () =>
      ({
        draft: {
          label: t("adminAnnouncements.statuses.draft"),
          color: "var(--chart-5)",
        },
        published: {
          label: t("adminAnnouncements.statuses.published"),
          color: "var(--chart-1)",
        },
      }) satisfies ChartConfig,
    [t],
  );

  const typeData = useMemo(() => {
    if (!data) return [];
    return data.byType
      .map((r) => ({ type: r.type, value: r.count }))
      .filter((r) => r.value > 0);
  }, [data]);

  const activeData = useMemo(() => {
    if (!data) return [];
    return [
      { activeState: "active", value: data.byActive.active },
      { activeState: "notActive", value: data.byActive.notActive },
    ].filter((r) => r.value > 0);
  }, [data]);

  const statusData = useMemo(() => {
    if (!data) return [];
    return [
      { status: "draft", value: data.byStatus.draft },
      { status: "published", value: data.byStatus.published },
    ].filter((r) => r.value > 0);
  }, [data]);

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">
            {t("adminAnnouncements.analytics.loadFailed")}
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mx-auto aspect-square w-full max-w-sm rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("adminAnnouncements.analytics.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("adminAnnouncements.analytics.subtitle")}
        </p>
        {formattedAsOf ? (
          <p className="text-xs text-muted-foreground">
            {t("adminAnnouncements.analytics.asOf", { date: formattedAsOf })}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title={t("adminAnnouncements.analytics.typeTitle")}
          description={t("adminAnnouncements.analytics.typeDescription")}
          emptyLabel={t("adminAnnouncements.analytics.empty")}
          data={typeData}
          config={typeConfig}
          nameKey="type"
        />

        <ChartCard
          title={t("adminAnnouncements.analytics.activeTitle")}
          description={t("adminAnnouncements.analytics.activeDescription")}
          emptyLabel={t("adminAnnouncements.analytics.empty")}
          data={activeData}
          config={activeConfig}
          nameKey="activeState"
        />

        <ChartCard
          title={t("adminAnnouncements.analytics.statusTitle")}
          description={t("adminAnnouncements.analytics.statusDescription")}
          emptyLabel={t("adminAnnouncements.analytics.empty")}
          data={statusData}
          config={statusConfig}
          nameKey="status"
        />
      </div>
    </div>
  );
}
