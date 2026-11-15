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
  Mail,
  Shield,
  PenSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
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

type DashboardShellMode = "admin" | "dashboard" | "support" | "content";

type TabColorConfig = {
  active: string;
  inactive: string;
  iconActive: string;
  iconInactive: string;
};

const DASHBOARD_TAB_COLORS: Record<DashboardShellMode, TabColorConfig> = {
  dashboard: {
    active:
      "bg-emerald-50 text-emerald-800 border-emerald-300/80 shadow-xs dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80",
    inactive:
      "text-zinc-600 hover:bg-emerald-50/70 hover:text-emerald-800 dark:text-zinc-400 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300",
    iconActive: "text-emerald-700 dark:text-emerald-400",
    iconInactive:
      "text-emerald-700/70 group-hover/tab:text-emerald-700 dark:text-emerald-400/70 dark:group-hover/tab:text-emerald-300",
  },
  admin: {
    active:
      "bg-amber-50 text-amber-900 border-amber-300/80 shadow-xs dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800/80",
    inactive:
      "text-zinc-600 hover:bg-amber-50/70 hover:text-amber-900 dark:text-zinc-400 dark:hover:bg-amber-950/50 dark:hover:text-amber-200",
    iconActive: "text-amber-700 dark:text-amber-400",
    iconInactive:
      "text-amber-700/70 group-hover/tab:text-amber-700 dark:text-amber-400/70 dark:group-hover/tab:text-amber-300",
  },
  support: {
    active:
      "bg-teal-50 text-teal-800 border-teal-300/80 shadow-xs dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/80",
    inactive:
      "text-zinc-600 hover:bg-teal-50/70 hover:text-teal-800 dark:text-zinc-400 dark:hover:bg-teal-950/50 dark:hover:text-teal-300",
    iconActive: "text-teal-700 dark:text-teal-400",
    iconInactive:
      "text-teal-700/70 group-hover/tab:text-teal-700 dark:text-teal-400/70 dark:group-hover/tab:text-teal-300",
  },
  content: {
    active:
      "bg-emerald-50 text-emerald-800 border-emerald-300/80 shadow-xs dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80",
    inactive:
      "text-zinc-600 hover:bg-emerald-50/70 hover:text-emerald-800 dark:text-zinc-400 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300",
    iconActive: "text-emerald-700 dark:text-emerald-400",
    iconInactive:
      "text-emerald-700/70 group-hover/tab:text-emerald-700 dark:text-emerald-400/70 dark:group-hover/tab:text-emerald-300",
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

        {/* Staff / Admin Dashboards (Only for needed roles) */}
        {staffTabs.length > 0 ? (
          <div
            className="grid gap-1 rounded-xl border border-emerald-900/10 bg-emerald-50/40 p-1 dark:border-emerald-800/30 dark:bg-emerald-950/20"
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
                      : cn("border-transparent font-medium", tabColor.inactive),
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
