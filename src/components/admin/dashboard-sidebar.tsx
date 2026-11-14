"use client";

import { useMemo } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Home,
  Users,
  Shapes,
  Settings,
  LogOut,
  ListChecks,
  FolderOpen,
  MessageSquare,
  Megaphone,
  Bell,
  LifeBuoy,
  Image,
  FileText,
  Mail,
  Shield,
  PenSquare,
  Tag,
  GraduationCap,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/landing/logo";
import { useSignOut } from "@/hooks/use-sign-out";
import { UserRole } from "@/shared/enums/user-role.enum";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type DashboardShellMode =
  | "admin"
  | "dashboard"
  | "dashboard-learning"
  | "dashboard-life"
  | "support"
  | "content";

type TabColorConfig = {
  active: string;
  inactive: string;
  iconActive: string;
  iconInactive: string;
};

const DASHBOARD_TAB_COLORS: Record<DashboardShellMode, TabColorConfig> = {
  dashboard: {
    active:
      "bg-blue-50 text-blue-700 border-blue-200/90 shadow-xs dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80",
    inactive:
      "text-zinc-600 hover:bg-blue-50/70 hover:text-blue-700 dark:text-zinc-400 dark:hover:bg-blue-950/50 dark:hover:text-blue-300",
    iconActive: "text-blue-600 dark:text-blue-400",
    iconInactive:
      "text-blue-600/70 group-hover/tab:text-blue-600 dark:text-blue-400/70 dark:group-hover/tab:text-blue-300",
  },
  "dashboard-learning": {
    active:
      "bg-violet-50 text-violet-700 border-violet-200/90 shadow-xs dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/80",
    inactive:
      "text-zinc-600 hover:bg-violet-50/70 hover:text-violet-700 dark:text-zinc-400 dark:hover:bg-violet-950/50 dark:hover:text-violet-300",
    iconActive: "text-violet-600 dark:text-violet-400",
    iconInactive:
      "text-violet-600/70 group-hover/tab:text-violet-600 dark:text-violet-400/70 dark:group-hover/tab:text-violet-300",
  },
  "dashboard-life": {
    active:
      "bg-rose-50 text-rose-700 border-rose-200/90 shadow-xs dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/80",
    inactive:
      "text-zinc-600 hover:bg-rose-50/70 hover:text-rose-700 dark:text-zinc-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300",
    iconActive: "text-rose-600 dark:text-rose-400",
    iconInactive:
      "text-rose-600/70 group-hover/tab:text-rose-600 dark:text-rose-400/70 dark:group-hover/tab:text-rose-300",
  },
  admin: {
    active:
      "bg-red-50 text-red-700 border-red-200/90 shadow-xs dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/80",
    inactive:
      "text-zinc-600 hover:bg-red-50/70 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-red-950/50 dark:hover:text-red-300",
    iconActive: "text-red-600 dark:text-red-400",
    iconInactive:
      "text-red-600/70 group-hover/tab:text-red-600 dark:text-red-400/70 dark:group-hover/tab:text-red-300",
  },
  support: {
    active:
      "bg-cyan-50 text-cyan-700 border-cyan-200/90 shadow-xs dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800/80",
    inactive:
      "text-zinc-600 hover:bg-cyan-50/70 hover:text-cyan-700 dark:text-zinc-400 dark:hover:bg-cyan-950/50 dark:hover:text-cyan-300",
    iconActive: "text-cyan-600 dark:text-cyan-400",
    iconInactive:
      "text-cyan-600/70 group-hover/tab:text-cyan-600 dark:text-cyan-400/70 dark:group-hover/tab:text-cyan-300",
  },
  content: {
    active:
      "bg-emerald-50 text-emerald-700 border-emerald-200/90 shadow-xs dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80",
    inactive:
      "text-zinc-600 hover:bg-emerald-50/70 hover:text-emerald-700 dark:text-zinc-400 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300",
    iconActive: "text-emerald-600 dark:text-emerald-400",
    iconInactive:
      "text-emerald-600/70 group-hover/tab:text-emerald-600 dark:text-emerald-400/70 dark:group-hover/tab:text-emerald-300",
  },
};

type SidebarConfig = {
  title: string;
  navItems: Array<{
    href: string;
    icon: typeof Home;
    label: string;
  }>;
  settingsHref?: string;
};

type SidebarUser = {
  role?: string | null;
};

function getPathWithoutLocale(path: string) {
  return path.replace(/^\/(ar|en)(?=\/|$)/, "");
}

export function DashboardSidebar({
  mode = "admin",
  user,
}: {
  mode?: DashboardShellMode;
  user?: SidebarUser;
}) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const normalizedPathname = useMemo(
    () => getPathWithoutLocale(pathname),
    [pathname],
  );
  const locale = useLocale();
  const direction = locale === "ar" ? "rtl" : "ltr";
  const sidebarSide = direction === "rtl" ? "right" : "left";

  const sidebarConfigByMode: Record<DashboardShellMode, SidebarConfig> = {
    admin: {
      title: t("shell.adminPanel"),
      navItems: [
        {
          href: "/admin/overview",
          icon: Home,
          label: t("shell.overview"),
        },
        {
          href: "/admin/users",
          icon: Users,
          label: t("shell.users"),
        },
        {
          href: "/admin/segments",
          icon: Shapes,
          label: t("shell.segments"),
        },
        {
          href: "/admin/announcements",
          icon: Megaphone,
          label: t("shell.announcements"),
        },
        {
          href: "/admin/notifications",
          icon: Bell,
          label: t("shell.topicPush"),
        },
        {
          href: "/admin/coupons",
          icon: Tag,
          label: t("shell.coupons"),
        },
      ],
      settingsHref: "/admin/settings",
    },
    dashboard: {
      title: t("shell.dashboard"),
      navItems: [
        {
          href: "/dashboard/overview",
          icon: Home,
          label: t("shell.overview"),
        },
        {
          href: "/dashboard/todos",
          icon: ListChecks,
          label: t("shell.todos"),
        },
        {
          href: "/dashboard/projects",
          icon: FolderOpen,
          label: t("shell.projects"),
        },
      ],
      settingsHref: "/dashboard/settings",
    },
    "dashboard-learning": {
      title: t("shell.learningPanel"),
      navItems: [
        {
          href: "/dashboard-learning/overview",
          icon: Home,
          label: t("shell.overview"),
        },
      ],
      settingsHref: "/dashboard/settings",
    },
    "dashboard-life": {
      title: t("shell.lifePanel"),
      navItems: [
        {
          href: "/dashboard-life/overview",
          icon: Home,
          label: t("shell.overview"),
        },
      ],
      settingsHref: "/dashboard/settings",
    },
    support: {
      title: t("shell.supportPanel"),
      navItems: [
        {
          href: "/support/overview",
          icon: Home,
          label: t("shell.overview"),
        },
        {
          href: "/support/tickets",
          icon: LifeBuoy,
          label: t("shell.tickets"),
        },
        {
          href: "/support/feedbacks",
          icon: MessageSquare,
          label: t("shell.feedbacks"),
        },
      ],
    },
    content: {
      title: t("shell.contentPanel"),
      navItems: [
        {
          href: "/content/overview",
          icon: Home,
          label: t("shell.overview"),
        },
        {
          href: "/content/assets",
          icon: Image,
          label: t("shell.contentAssets"),
        },
        {
          href: "/content/blogs",
          icon: FileText,
          label: t("shell.blogs"),
        },
        {
          href: "/content/newsletter",
          icon: Mail,
          label: t("shell.newsletter"),
        },
      ],
    },
  };
  const config = sidebarConfigByMode[mode];
  const { isSigningOut, handleSignOut } = useSignOut();
  const { setOpenMobile } = useSidebar();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isSupport = user?.role === UserRole.SUPPORT;
  const isContentManager = user?.role === UserRole.CONTENT_MANAGER;

  const isNavItemActive = (href: string) => {
    const normalizedHref = getPathWithoutLocale(href);

    if (normalizedPathname === normalizedHref) {
      return true;
    }

    return normalizedPathname.startsWith(`${normalizedHref}/`);
  };

  const handleNavigate = () => {
    setOpenMobile(false);
  };

  const primaryTabs = [
    {
      mode: "dashboard" as const,
      href: "/dashboard/overview",
      icon: Home,
      label: t("shell.dashboard"),
      shortLabel: t("shell.mainShort"),
    },
    {
      mode: "dashboard-learning" as const,
      href: "/dashboard-learning/overview",
      icon: GraduationCap,
      label: t("shell.learningPanel"),
      shortLabel: t("shell.learningShort"),
    },

    {
      mode: "dashboard-life" as const,
      href: "/dashboard-life/overview",
      icon: Heart,
      label: t("shell.lifePanel"),
      shortLabel: t("shell.lifeShort"),
    },
  ];

  const staffTabs = [
    {
      mode: "admin" as const,
      href: "/admin/overview",
      icon: Shield,
      label: t("shell.adminPanel"),
      shortLabel: t("shell.admin"),
      show: isAdmin,
    },
    {
      mode: "support" as const,
      href: "/support/overview",
      icon: LifeBuoy,
      label: t("shell.supportPanel"),
      shortLabel: t("shell.support"),
      show: isAdmin || isSupport,
    },
    {
      mode: "content" as const,
      href: "/content/overview",
      icon: PenSquare,
      label: t("shell.contentPanel"),
      shortLabel: t("shell.content"),
      show: isAdmin || isContentManager,
    },
  ].filter((item) => item.show);

  const showDashboardSwitcher = primaryTabs.length > 1 || staffTabs.length > 0;

  return (
    <Sidebar collapsible="offcanvas" variant="inset" side={sidebarSide}>
      <SidebarHeader className="gap-2.5 p-2 pb-3 border-b border-sidebar-border/60">
        {/* Brand Bar */}
        <div className="flex items-center justify-between px-1.5 pt-0.5">
          <Link
            href="/dashboard/overview"
            className="group flex items-center gap-2.5 rounded-lg py-1 px-1 transition-opacity hover:opacity-85 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring cursor-pointer"
          >
            <Logo size="sm" />
            <div className="flex flex-col text-start">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
                {t("shell.brandTitle")}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium leading-none">
                {t("shell.brandSubtitle")}
              </span>
            </div>
          </Link>
        </div>

        {/* Dashboard Switcher Rows */}
        {showDashboardSwitcher ? (
          <div className="flex flex-col gap-1.5">
            {/* Core Dashboards (Main, Learning, Life, Work) */}
            <div
              className="grid grid-cols-3 gap-1 rounded-xl border border-zinc-200/80 bg-zinc-100/60 p-1 dark:border-zinc-800/80 dark:bg-zinc-900/60"
              role="tablist"
              aria-label={t("shell.quickDashboardSwitch")}
            >
              {primaryTabs.map((tab) => {
                const isActive = tab.mode === mode;
                const Icon = tab.icon;
                const tabColor = DASHBOARD_TAB_COLORS[tab.mode];
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    prefetch={false}
                    onClick={handleNavigate}
                    role="tab"
                    aria-selected={isActive}
                    className={cn(
                      "group/tab flex flex-col items-center justify-center gap-1 rounded-lg py-1.5 px-0.5 text-center transition-all cursor-pointer border",
                      isActive
                        ? cn(tabColor.active, "font-bold")
                        : cn(
                            "border-transparent font-medium",
                            tabColor.inactive,
                          ),
                    )}
                    title={tab.label}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-transform group-hover/tab:scale-110",
                        isActive ? tabColor.iconActive : tabColor.iconInactive,
                      )}
                    />
                    <span className="text-[10px] leading-tight truncate w-full px-0.5">
                      {tab.shortLabel}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Staff / Admin Dashboards (Only for needed roles) */}
            {staffTabs.length > 0 && (
              <div
                className="grid gap-1 rounded-xl border border-zinc-200/80 bg-zinc-100/60 p-1 dark:border-zinc-800/80 dark:bg-zinc-900/60"
                style={{
                  gridTemplateColumns: `repeat(${staffTabs.length}, minmax(0, 1fr))`,
                }}
                role="tablist"
                aria-label={t("shell.staffPanels")}
              >
                {staffTabs.map((tab) => {
                  const isActive = tab.mode === mode;
                  const Icon = tab.icon;
                  const tabColor = DASHBOARD_TAB_COLORS[tab.mode];
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      prefetch={false}
                      onClick={handleNavigate}
                      role="tab"
                      aria-selected={isActive}
                      className={cn(
                        "group/tab flex flex-col items-center justify-center gap-1 rounded-lg py-1.5 px-0.5 text-center transition-all cursor-pointer border",
                        isActive
                          ? cn(tabColor.active, "font-bold")
                          : cn(
                              "border-transparent font-medium",
                              tabColor.inactive,
                            ),
                      )}
                      title={tab.label}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0 transition-transform group-hover/tab:scale-110",
                          isActive
                            ? tabColor.iconActive
                            : tabColor.iconInactive,
                        )}
                      />
                      <span className="text-[10px] leading-tight truncate w-full px-0.5">
                        {tab.shortLabel}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="px-2 py-1">
            <span className="font-semibold text-xs text-muted-foreground">
              {config.title}
            </span>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {config.navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isNavItemActive(item.href)}
                    tooltip={item.label}
                    className="text-muted-foreground cursor-pointer"
                  >
                    <Link
                      href={item.href}
                      prefetch={false}
                      onClick={handleNavigate}
                      className="cursor-pointer"
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {config.settingsHref ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={t("shell.settings")}
                isActive={isNavItemActive(config.settingsHref)}
                className="cursor-pointer"
              >
                <Link
                  href={config.settingsHref}
                  prefetch={false}
                  onClick={handleNavigate}
                  className="cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  <span>{t("shell.settings")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={t("shell.logout")}
              className="cursor-pointer"
              disabled={isSigningOut}
            >
              <button onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="h-4 w-4" />
                <span>
                  {isSigningOut ? t("shell.signingOut") : t("shell.logout")}
                </span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
