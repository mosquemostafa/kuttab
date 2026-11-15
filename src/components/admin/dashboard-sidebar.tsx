"use client";

import { useMemo } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Home,
  Users,
  Settings,
  LogOut,
  ListChecks,
  FolderOpen,
  MessageSquare,
  Megaphone,
  Bell,
  LifeBuoy,
  Mail,
  ShieldCheck,
  LayoutDashboard,
  PenSquare,
  GraduationCap,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useSignOut } from "@/hooks/use-sign-out";

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
  | "support"
  | "content"
  | "student"
  | "parent";

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
  user: _user,
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
      title: t("shell.dashboardPanel"),
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
    student: {
      title: t("shell.studentPanel"),
      navItems: [
        {
          href: "/student/overview",
          icon: Home,
          label: t("shell.overview"),
        },
      ],
    },
    parent: {
      title: t("shell.parentPanel"),
      navItems: [
        {
          href: "/parent/overview",
          icon: Home,
          label: t("shell.overview"),
        },
      ],
    },
  };
  const config = sidebarConfigByMode[mode];
  const { isSigningOut, handleSignOut } = useSignOut();
  const { setOpenMobile } = useSidebar();
  const brandHref = config.navItems[0]?.href ?? "/";

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

  const modeMetaByMode = {
    admin: {
      icon: ShieldCheck,
      containerClass:
        "border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-amber-950/20 dark:to-transparent dark:border-amber-500/30",
      iconBoxClass:
        "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:bg-amber-400/20 dark:text-amber-300 dark:border-amber-400/30",
    },
    support: {
      icon: LifeBuoy,
      containerClass:
        "border-teal-500/25 bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent dark:from-teal-950/40 dark:via-teal-950/20 dark:to-transparent dark:border-teal-500/30",
      iconBoxClass:
        "bg-teal-500/15 text-teal-700 border-teal-500/30 dark:bg-teal-400/20 dark:text-teal-300 dark:border-teal-400/30",
    },
    content: {
      icon: PenSquare,
      containerClass:
        "border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-transparent dark:border-emerald-500/30",
      iconBoxClass:
        "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:bg-emerald-400/20 dark:text-emerald-300 dark:border-emerald-400/30",
    },
    dashboard: {
      icon: LayoutDashboard,
      containerClass:
        "border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-transparent dark:border-emerald-500/30",
      iconBoxClass:
        "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:bg-emerald-400/20 dark:text-emerald-300 dark:border-emerald-400/30",
    },
    student: {
      icon: GraduationCap,
      containerClass:
        "border-sky-500/25 bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent dark:from-sky-950/40 dark:via-sky-950/20 dark:to-transparent dark:border-sky-500/30",
      iconBoxClass:
        "bg-sky-500/15 text-sky-700 border-sky-500/30 dark:bg-sky-400/20 dark:text-sky-300 dark:border-sky-400/30",
    },
    parent: {
      icon: UserCheck,
      containerClass:
        "border-indigo-500/25 bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-950/40 dark:via-indigo-950/20 dark:to-transparent dark:border-indigo-500/30",
      iconBoxClass:
        "bg-indigo-500/15 text-indigo-700 border-indigo-500/30 dark:bg-indigo-400/20 dark:text-indigo-300 dark:border-indigo-400/30",
    },
  };
  const modeMeta = modeMetaByMode[mode];
  const ModeIcon = modeMeta.icon;

  return (
    <Sidebar collapsible="offcanvas" variant="inset" side={sidebarSide}>
      <SidebarHeader className="gap-2.5 p-2 pb-3 border-b border-sidebar-border/60">
        {/* Brand Bar */}
        <div className="flex items-center justify-between px-1.5 pt-0.5">
          <Link
            href={brandHref}
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

        {/* Active Dashboard Badge */}
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition-all shadow-2xs",
            modeMeta.containerClass,
          )}
        >
          <div
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg border shadow-2xs",
              modeMeta.iconBoxClass,
            )}
          >
            <ModeIcon className="size-3.5" />
          </div>
          <div className="flex flex-col min-w-0 text-start flex-1">
            <span className="text-xs font-bold leading-tight tracking-tight text-foreground truncate">
              {config.title}
            </span>
          </div>
        </div>
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
