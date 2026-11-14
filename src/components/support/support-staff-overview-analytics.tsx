"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { useLocale, useTranslations } from "next-intl";
import { Inbox, Layers, LifeBuoy, MessageSquare } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import { apiClient } from "@/lib/api/api-client";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
type RangeDays = "7" | "30";

function KpiCard({
  title,
  hint,
  value,
  icon: Icon,
}: {
  title: string;
  hint: string;
  value: number;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <Card className="@container/card">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex flex-col gap-0.5">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {value.toLocaleString()}
          </CardTitle>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        </div>
      </CardHeader>
      <CardFooter className="pt-0">
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardFooter>
    </Card>
  );
}

export function SupportStaffOverviewAnalytics() {
  const t = useTranslations("dashboard.supportOverview.analytics");
  const locale = useLocale();
  const [range, setRange] = useState<RangeDays>("30");

  const { data, error, isLoading } = useSWR(
    "support-staff-overview",
    () => apiClient.supportStaff.overview(),
    { revalidateOnFocus: false },
  );

  const chartConfig = useMemo(
    () =>
      ({
        tickets: {
          label: t("chartSeriesTickets"),
          color: "var(--chart-1)",
        },
        feedbacks: {
          label: t("chartSeriesFeedbacks"),
          color: "var(--chart-2)",
        },
      }) satisfies ChartConfig,
    [t],
  );

  const ticketStatusPieConfig = useMemo(
    () =>
      ({
        open: { label: t("open"), color: "var(--chart-1)" },
        resolved: { label: t("resolved"), color: "var(--chart-3)" },
        closed: { label: t("closed"), color: "var(--chart-4)" },
        other: { label: t("other"), color: "var(--chart-5)" },
      }) satisfies ChartConfig,
    [t],
  );

  const feedbackTypePieConfig = useMemo(
    () =>
      ({
        suggestion: { label: t("suggestion"), color: "var(--chart-1)" },
        complaint: { label: t("complaint"), color: "var(--chart-2)" },
        other: { label: t("other"), color: "var(--chart-5)" },
      }) satisfies ChartConfig,
    [t],
  );

  const feedbackStatusPieConfig = useMemo(
    () =>
      ({
        new: { label: t("new"), color: "var(--chart-1)" },
        reviewed: { label: t("reviewed"), color: "var(--chart-2)" },
        closed: { label: t("closed"), color: "var(--chart-3)" },
        other: { label: t("other"), color: "var(--chart-5)" },
      }) satisfies ChartConfig,
    [t],
  );

  const formattedAsOf = useMemo(() => {
    if (!data?.generatedAt) return null;
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(data.generatedAt));
  }, [data?.generatedAt, locale]);

  const chartData = useMemo(() => {
    if (!data?.series?.length) return [];
    const slice =
      range === "7" ? data.series.slice(-7) : data.series.slice(-30);
    return slice;
  }, [data?.series, range]);

  const ticketStatusPieData = useMemo(() => {
    if (!data) return [];
    return [
      { type: "open" as const, value: data.tickets.byStatus.open },
      { type: "resolved" as const, value: data.tickets.byStatus.resolved },
      { type: "closed" as const, value: data.tickets.byStatus.closed },
      { type: "other" as const, value: data.tickets.byStatus.other },
    ].filter((r) => r.value > 0);
  }, [data]);

  const feedbackTypePieData = useMemo(() => {
    if (!data) return [];
    return [
      { type: "suggestion" as const, value: data.feedbacks.byType.suggestion },
      { type: "complaint" as const, value: data.feedbacks.byType.complaint },
      { type: "other" as const, value: data.feedbacks.byType.other },
    ].filter((r) => r.value > 0);
  }, [data]);

  const feedbackStatusPieData = useMemo(() => {
    if (!data) return [];
    return [
      { status: "new" as const, value: data.feedbacks.byStatus.new },
      { status: "reviewed" as const, value: data.feedbacks.byStatus.reviewed },
      { status: "closed" as const, value: data.feedbacks.byStatus.closed },
      { status: "other" as const, value: data.feedbacks.byStatus.other },
    ].filter((r) => r.value > 0);
  }, [data]);

  const formatTick = (value: string) => {
    const d = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(d);
  };

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">{t("loadFailed")}</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
              <CardFooter>
                <Skeleton className="h-3 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="mx-auto aspect-square max-h-70 w-full max-w-md rounded-xl" />
          <Skeleton className="mx-auto aspect-square max-h-70 w-full max-w-md rounded-xl" />
          <Skeleton className="mx-auto aspect-square max-h-70 w-full max-w-md rounded-xl md:col-span-2 xl:col-span-1" />
        </div>
        <Skeleton className="h-75 w-full rounded-xl" />
      </div>
    );
  }

  const { tickets, feedbacks, staleDays, series } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        {formattedAsOf ? (
          <p className="text-xs text-muted-foreground">
            {t("asOf", { date: formattedAsOf })}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {t("staleHint", { days: staleDays })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={t("metrics.openTickets")}
          hint={t("metrics.openTicketsHint")}
          value={tickets.byStatus.open}
          icon={LifeBuoy}
        />
        <KpiCard
          title={t("metrics.newFeedback")}
          hint={t("metrics.newFeedbackHint")}
          value={feedbacks.byStatus.new}
          icon={Inbox}
        />
        <KpiCard
          title={t("metrics.totalTickets")}
          hint={t("metrics.totalTicketsHint")}
          value={tickets.total}
          icon={Layers}
        />
        <KpiCard
          title={t("metrics.totalFeedbacks")}
          hint={t("metrics.totalFeedbacksHint")}
          value={feedbacks.total}
          icon={MessageSquare}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("pieTicketsTitle")}</CardTitle>
            <CardDescription>{t("pieTicketsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-2">
            {ticketStatusPieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("pieEmpty")}</p>
            ) : (
              <ChartContainer
                config={ticketStatusPieConfig}
                className="mx-auto aspect-square w-full max-w-md [&_.recharts-pie-label-text]:fill-foreground"
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent hideLabel nameKey="type" />}
                  />
                  <Pie
                    data={ticketStatusPieData}
                    dataKey="value"
                    nameKey="type"
                    innerRadius={56}
                    strokeWidth={2}
                  >
                    {ticketStatusPieData.map((entry) => (
                      <Cell
                        key={entry.type}
                        fill={`var(--color-${entry.type})`}
                      />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="type" />}
                    className="-translate-y-2 flex-wrap gap-2"
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("pieFeedbackTypesTitle")}</CardTitle>
            <CardDescription>
              {t("pieFeedbackTypesDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-2">
            {feedbackTypePieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("pieEmpty")}</p>
            ) : (
              <ChartContainer
                config={feedbackTypePieConfig}
                className="mx-auto aspect-square w-full max-w-md [&_.recharts-pie-label-text]:fill-foreground"
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent hideLabel nameKey="type" />}
                  />
                  <Pie
                    data={feedbackTypePieData}
                    dataKey="value"
                    nameKey="type"
                    innerRadius={56}
                    strokeWidth={2}
                  >
                    {feedbackTypePieData.map((entry) => (
                      <Cell
                        key={entry.type}
                        fill={`var(--color-${entry.type})`}
                      />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="type" />}
                    className="-translate-y-2 flex-wrap gap-2"
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("pieFeedbackStatusTitle")}</CardTitle>
            <CardDescription>
              {t("pieFeedbackStatusDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-2">
            {feedbackStatusPieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("pieEmpty")}</p>
            ) : (
              <ChartContainer
                config={feedbackStatusPieConfig}
                className="mx-auto aspect-square w-full max-w-md [&_.recharts-pie-label-text]:fill-foreground"
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent hideLabel nameKey="status" />}
                  />
                  <Pie
                    data={feedbackStatusPieData}
                    dataKey="value"
                    nameKey="status"
                    innerRadius={56}
                    strokeWidth={2}
                  >
                    {feedbackStatusPieData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={`var(--color-${entry.status})`}
                      />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="status" />}
                    className="-translate-y-2 flex-wrap gap-2"
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>{t("chartTitle")}</CardTitle>
            <CardDescription>{t("chartDescription")}</CardDescription>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t("chartTitle")}
          >
            <Button
              type="button"
              variant={range === "7" ? "default" : "outline"}
              size="sm"
              onClick={() => setRange("7")}
            >
              {t("period7")}
            </Button>
            <Button
              type="button"
              variant={range === "30" ? "default" : "outline"}
              size="sm"
              onClick={() => setRange("30")}
            >
              {t("period30")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {series.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("loadFailed")}</p>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[min(320px,50vh)] w-full"
            >
              <AreaChart accessibilityLayer data={chartData}>
                <defs>
                  <linearGradient id="fillTickets" x1="0" x2="0" y1="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-tickets)"
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-tickets)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="fillFeedbacks"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-feedbacks)"
                      stopOpacity={0.85}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-feedbacks)"
                      stopOpacity={0.08}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={16}
                  tickFormatter={formatTick}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="feedbacks"
                  type="natural"
                  fill="url(#fillFeedbacks)"
                  fillOpacity={1}
                  stroke="var(--color-feedbacks)"
                />
                <Area
                  dataKey="tickets"
                  type="natural"
                  fill="url(#fillTickets)"
                  fillOpacity={1}
                  stroke="var(--color-tickets)"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>
              {t("openStale")}:{" "}
              <Badge variant="secondary" className="tabular-nums">
                {tickets.openStale}
              </Badge>
            </span>
            <span>
              {t("staleNew")}:{" "}
              <Badge variant="secondary" className="tabular-nums">
                {feedbacks.staleNew}
              </Badge>
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
