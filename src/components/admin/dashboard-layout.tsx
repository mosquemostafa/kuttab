"use client";

import dynamic from "next/dynamic";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import React from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { HeaderUserControls } from "@/components/header-user-controls";
import { DashboardInstallPwaBar } from "@/components/dashboard/dashboard-install-pwa-bar";
import {
  BreadcrumbProvider,
  useBreadcrumb,
} from "@/components/dashboard/breadcrumb-context";
import {
  CustomSidebarProvider,
  useCustomSidebar,
} from "@/components/dashboard/dashboard-custom-sidebar-context";
import { cn } from "@/lib/utils";

const DashboardSidebar = dynamic(
  () =>
    import("@/components/admin/dashboard-sidebar").then(
      (m) => m.DashboardSidebar,
    ),
  { ssr: false },
);

type DashboardShellMode = "admin" | "dashboard" | "support" | "content";

type DashboardShellUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
};

type DashboardLayoutProps = {
  children: React.ReactNode;
  mode?: DashboardShellMode;
  user: DashboardShellUser;
  showInstallPwaBanner?: boolean;
};

const DashboardLayoutContent = ({
  children,
  mode = "admin",
  user,
  showInstallPwaBanner = false,
}: DashboardLayoutProps) => {
  const t = useTranslations("dashboard");
  const shellConfigByMode: Record<
    DashboardShellMode,
    { rootHref: string; rootPathPrefix: string; rootLabel: string }
  > = {
    admin: {
      rootHref: "/admin/overview",
      rootPathPrefix: "/admin",
      rootLabel: t("shell.admin"),
    },
    dashboard: {
      rootHref: "/dashboard/overview",
      rootPathPrefix: "/dashboard",
      rootLabel: t("shell.dashboard"),
    },
    support: {
      rootHref: "/support/overview",
      rootPathPrefix: "/support",
      rootLabel: t("shell.support"),
    },
    content: {
      rootHref: "/content/overview",
      rootPathPrefix: "/content",
      rootLabel: t("shell.content"),
    },
  };
  const shellConfig = shellConfigByMode[mode];
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { overrides } = useBreadcrumb();
  const { customSidebar } = useCustomSidebar();
  const pathSegments = pathname.split("/").filter((segment) => segment);
  const baseSegments = shellConfig.rootPathPrefix
    .split("/")
    .filter((segment) => segment);

  const hasBasePrefix = baseSegments.every(
    (segment, index) => pathSegments[index] === segment,
  );
  const relevantSegments = hasBasePrefix
    ? pathSegments.slice(baseSegments.length)
    : pathSegments;

  const segmentLabelMap: Record<string, string> = {
    overview: t("shell.overview"),
    todos: t("shell.todos"),
    tasks: t("shell.tasks"),
    projects: t("shell.projects"),
    users: t("shell.users"),
    segments: t("shell.segments"),
    announcements: t("shell.announcements"),
    newsletter: t("shell.newsletter"),
    settings: t("shell.settings"),
    support: t("shell.support"),
    content: t("shell.content"),
    tickets: t("shell.tickets"),
    feedbacks: t("shell.feedbacks"),
    create: t("shell.create"),
    edit: t("shell.edit"),
  };

  const getSegmentLabel = (segment: string) => {
    if (overrides[segment]) {
      return overrides[segment];
    }
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        segment,
      );
    if (isUuid) {
      return segment;
    }
    if (segment === "notifications") {
      return mode === "admin"
        ? t("shell.topicPush")
        : t("shell.inAppNotifications");
    }
    return segmentLabelMap[segment] ?? segment.replace(/-/g, " ");
  };

  const handleNavigate = () => {
    setOpenMobile(false);
  };

  return (
    <>
      {customSidebar ? (
        customSidebar
      ) : (
        <DashboardSidebar mode={mode} user={user} />
      )}
      <SidebarInset className="bg-background">
        {showInstallPwaBanner ? <DashboardInstallPwaBar /> : null}

        {/* Sticky sidebar toggle — mobile only, floats over content while scrolling */}
        <div className="lg:hidden sticky top-2 z-10 w-fit ms-3 -mb-10 bg-background/40 backdrop-blur-md rounded-md">
          <SidebarTrigger />
        </div>

        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 px-3 sm:px-4">
            {/* Desktop-only trigger inside the header, reserves space for the floating sticky trigger on mobile */}
            <SidebarTrigger className="-ms-1 shrink-0 invisible pointer-events-none lg:visible lg:pointer-events-auto lg:flex" />
            <Separator
              orientation="vertical"
              className="me-1 sm:me-2 h-4 shrink-0 hidden sm:block"
            />
            <Breadcrumb className="min-w-0 flex-1 overflow-x-auto scrollbar-hide py-1">
              <BreadcrumbList className="flex flex-nowrap items-center whitespace-nowrap gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <BreadcrumbItem className="shrink-0">
                  <BreadcrumbLink asChild className="shrink-0">
                    <Link
                      href={shellConfig.rootHref}
                      onClick={handleNavigate}
                      title={shellConfig.rootLabel}
                    >
                      {shellConfig.rootLabel}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {relevantSegments.length > 0 && (
                  <BreadcrumbSeparator className="shrink-0" />
                )}
                {relevantSegments.map((segment, index) => {
                  const segmentPath = relevantSegments
                    .slice(0, index + 1)
                    .join("/");
                  const href = `${shellConfig.rootPathPrefix}/${segmentPath}`;
                  const isLast = index === relevantSegments.length - 1;
                  const label = getSegmentLabel(segment);
                  const hasOverride = Boolean(overrides[segment]);
                  return (
                    <React.Fragment key={href}>
                      <BreadcrumbItem className="shrink-0">
                        {isLast ? (
                          <BreadcrumbPage
                            className={cn(
                              "font-normal text-foreground max-w-[280px] sm:max-w-[420px] truncate block",
                              !hasOverride && "capitalize",
                            )}
                            title={
                              typeof label === "string" ? label : undefined
                            }
                          >
                            {label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink
                            asChild
                            className={cn(
                              "max-w-[140px] sm:max-w-[220px] truncate block",
                              !hasOverride && "capitalize",
                            )}
                            title={
                              typeof label === "string" ? label : undefined
                            }
                          >
                            <Link href={href} onClick={handleNavigate}>
                              {label}
                            </Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator className="shrink-0" />}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ms-auto flex shrink-0 items-center gap-2 sm:gap-3 px-3 sm:px-4">
            <HeaderUserControls user={user} />
          </div>
        </header>

        {children}
      </SidebarInset>
    </>
  );
};

const DashboardLayout = ({
  children,
  mode = "admin",
  user,
  showInstallPwaBanner = false,
}: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <BreadcrumbProvider>
        <CustomSidebarProvider>
          <DashboardLayoutContent
            mode={mode}
            user={user}
            showInstallPwaBanner={showInstallPwaBanner}
          >
            {children}
          </DashboardLayoutContent>
        </CustomSidebarProvider>
      </BreadcrumbProvider>
    </SidebarProvider>
  );
};

export default DashboardLayout;
