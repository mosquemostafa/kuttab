"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { useLocale, useTranslations } from "next-intl";
import { BellRing, ShieldCheck, UserCheck, Users } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type RangeDays = 7 | 30;

function KpiCard({
  title,
  hint,
  value,
  icon: Icon,
}: {
  title: string;
  hint: string;
  value: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <Card className="@container/card">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex flex-col gap-0.5">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {value}
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

function toCssKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "_");
}

export function AdminOverviewAnalytics() {
  const t = useTranslations("dashboard.adminOverview.analytics");
  const locale = useLocale();
  const [range, setRange] = useState<RangeDays>(30);

  const { data, error, isLoading } = useSWR(
    `admin-overview-${range}`,
    () => apiClient.admin.overview({ range }),
    { revalidateOnFocus: false },
  );

  const formatNumber = (value: number) => value.toLocaleString(locale);

  const formatTick = (value: string) => {
    const d = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(d);
  };

  const formattedAsOf = useMemo(() => {
    if (!data?.generatedAt) return null;
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(data.generatedAt));
  }, [data?.generatedAt, locale]);

  const signupsConfig = useMemo(
    () =>
      ({
        count: {
          label: t("series.signups"),
          color: "var(--chart-1)",
        },
      }) satisfies ChartConfig,
    [t],
  );

  const emailPieConfig = useMemo(
    () =>
      ({
        verified: { label: t("verified"), color: "var(--chart-3)" },
        unverified: { label: t("unverified"), color: "var(--chart-5)" },
      }) satisfies ChartConfig,
    [t],
  );

  const banningPieConfig = useMemo(
    () =>
      ({
        notBanned: { label: t("notBanned"), color: "var(--chart-3)" },
        bannedPermanent: {
          label: t("bannedPermanent"),
          color: "var(--chart-1)",
        },
        bannedTemporary: {
          label: t("bannedTemporary"),
          color: "var(--chart-4)",
        },
      }) satisfies ChartConfig,
    [t],
  );

  const roleLabel = (key: string) => {
    if (key === "admin") return t("role.admin");
    if (key === "content_manager") return t("role.contentManager");
    if (key === "support") return t("role.support");
    if (key === "user") return t("role.user");
    if (key === "unspecified") return t("role.unspecified");
    return t("role.other", { key });
  };

  const rolePieData = useMemo(() => {
    if (!data) return [] as Array<{ id: string; key: string; value: number }>;
    return data.users.roles
      .filter((r) => r.count > 0)
      .map((r) => ({ id: toCssKey(r.key), key: r.key, value: r.count }));
  }, [data]);

  const rolePieConfig = useMemo(() => {
    const palette = [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
    ];
    const entries = rolePieData.map((item, i) => [
      item.id,
      {
        label: roleLabel(item.key),
        color: palette[i % palette.length],
      },
    ]);

    return Object.fromEntries(entries) satisfies ChartConfig;
  }, [rolePieData]);

  const emailPieData = useMemo(() => {
    if (!data) return [];
    return [
      { type: "verified" as const, value: data.users.emailVerified.verified },
      {
        type: "unverified" as const,
        value: data.users.emailVerified.unverified,
      },
    ].filter((x) => x.value > 0);
  }, [data]);

  const banningPieData = useMemo(() => {
    if (!data) return [];
    return [
      { type: "notBanned" as const, value: data.users.banning.notBanned },
      {
        type: "bannedPermanent" as const,
        value: data.users.banning.bannedPermanent,
      },
      {
        type: "bannedTemporary" as const,
        value: data.users.banning.bannedTemporary,
      },
    ].filter((x) => x.value > 0);
  }, [data]);

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
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={t("metrics.totalUsers")}
          hint={t("metrics.totalUsersHint")}
          value={formatNumber(data.users.totals.total)}
          icon={Users}
        />
        <KpiCard
          title={t("metrics.newUsers7")}
          hint={t("metrics.newUsers7Hint")}
          value={formatNumber(data.users.totals.newLast7Days)}
          icon={UserCheck}
        />
        <KpiCard
          title={t("metrics.newUsers30")}
          hint={t("metrics.newUsers30Hint")}
          value={formatNumber(data.users.totals.newLast30Days)}
          icon={BellRing}
        />
        <KpiCard
          title={t("metrics.verifiedRatio")}
          hint={t("metrics.verifiedRatioHint")}
          value={`${(data.users.emailVerified.verifiedRatio * 100).toFixed(1)}%`}
          icon={ShieldCheck}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>{t("signupsChartTitle")}</CardTitle>
              <CardDescription>{t("signupsChartDescription")}</CardDescription>
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label={t("rangeLabel")}
            >
              <Button
                type="button"
                variant={range === 7 ? "default" : "outline"}
                size="sm"
                onClick={() => setRange(7)}
              >
                {t("period7")}
              </Button>
              <Button
                type="button"
                variant={range === 30 ? "default" : "outline"}
                size="sm"
                onClick={() => setRange(30)}
              >
                {t("period30")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={signupsConfig}
              className="aspect-auto h-[min(320px,50vh)] w-full"
            >
              <AreaChart accessibilityLayer data={data.series.signupsByDay}>
                <defs>
                  <linearGradient id="fillSignups" x1="0" x2="0" y1="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.85}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-count)"
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
                  dataKey="count"
                  type="natural"
                  fill="url(#fillSignups)"
                  fillOpacity={1}
                  stroke="var(--color-count)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("emailPieTitle")}</CardTitle>
            <CardDescription>{t("emailPieDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-2">
            <ChartContainer
              config={emailPieConfig}
              className="mx-auto aspect-square w-full max-w-sm"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel nameKey="type" />}
                />
                <Pie
                  data={emailPieData}
                  dataKey="value"
                  nameKey="type"
                  innerRadius={56}
                  strokeWidth={2}
                >
                  {emailPieData.map((entry) => (
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("rolesPieTitle")}</CardTitle>
            <CardDescription>{t("rolesPieDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-2">
            {rolePieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              <ChartContainer
                config={rolePieConfig}
                className="mx-auto aspect-square w-full max-w-sm"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        nameKey="id"
                        formatter={(_, __, payload) => (
                          <div className="flex w-full items-center justify-between gap-2">
                            <span className="text-muted-foreground">
                              {roleLabel(String(payload?.payload?.key ?? ""))}
                            </span>
                            <span className="font-mono tabular-nums">
                              {formatNumber(Number(payload?.value ?? 0))}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={rolePieData}
                    dataKey="value"
                    nameKey="id"
                    innerRadius={56}
                    strokeWidth={2}
                  >
                    {rolePieData.map((entry) => (
                      <Cell key={entry.id} fill={`var(--color-${entry.id})`} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="id" />}
                    className="-translate-y-2 flex-wrap gap-2"
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("banningPieTitle")}</CardTitle>
            <CardDescription>{t("banningPieDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-2">
            <ChartContainer
              config={banningPieConfig}
              className="mx-auto aspect-square w-full max-w-sm"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel nameKey="type" />}
                />
                <Pie
                  data={banningPieData}
                  dataKey="value"
                  nameKey="type"
                  innerRadius={56}
                  strokeWidth={2}
                >
                  {banningPieData.map((entry) => (
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
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("segmentsTitle")}</CardTitle>
            <CardDescription>{t("segmentsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("segmentsColumns.segment")}</TableHead>
                  <TableHead className="text-end">
                    {t("segmentsColumns.users")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{t("unsegmented")}</TableCell>
                  <TableCell className="text-end tabular-nums">
                    {formatNumber(data.users.segmentation.unsegmented)}
                  </TableCell>
                </TableRow>
                {data.users.segmentation.segments.map((segment) => (
                  <TableRow key={segment.segmentId}>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden>{segment.icon}</span>
                        <span>{segment.name}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {formatNumber(segment.userCount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
