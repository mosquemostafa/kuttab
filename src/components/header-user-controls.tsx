"use client";

import * as React from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  Bell,
  Globe,
  House,
  LifeBuoy,
  LogOut,
  Mail,
  MessageSquare,
  Moon,
  Sun,
  Settings,
  Shield,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "@/components/theme-provider";

import { useSignOut } from "@/hooks/use-sign-out";
import {
  UserRole,
  getDashboardPathForRole,
  normalizeUserRole,
} from "@/shared/enums/user-role.enum";
import { NotificationMenuBadge } from "@/components/notifications/notification-menu-badge";
import { useNotifications } from "@/components/notifications/notification-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HeaderUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
};

type HeaderUserControlsProps = {
  user: HeaderUser;
};

export function HeaderUserControls({ user }: HeaderUserControlsProps) {
  const normalizedRole = normalizeUserRole(user.role);
  const isRegularUser = normalizedRole === UserRole.USER;
  const isAdmin = normalizedRole === UserRole.ADMIN;
  const t = useTranslations();
  const { unreadCount } = useNotifications();
  const { isSigningOut, handleSignOut } = useSignOut();

  const getRoleBadge = (role: UserRole): string | null => {
    switch (role) {
      case UserRole.ADMIN:
        return t("header.adminBadge");
      case UserRole.SUPPORT:
        return t("header.supportBadge");
      case UserRole.CONTENT:
        return t("header.contentBadge");
      case UserRole.STUDENT:
        return t("header.studentBadge");
      case UserRole.PARENT:
        return t("header.parentBadge");
      default:
        return null;
    }
  };
  const roleBadge = !isRegularUser ? getRoleBadge(normalizedRole) : null;

  const { resolvedTheme, setTheme } = useTheme();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isSwitchingLocale, startTransition] = React.useTransition();
  const selectedTheme = resolvedTheme === "dark" ? "dark" : "light";
  const selectedLocale = locale === "ar" ? "ar" : "en";

  const getDirection = (nextLocale: "ar" | "en") =>
    nextLocale === "ar" ? "rtl" : "ltr";

  const handleLocaleSwitch = (nextLocale: "ar" | "en") => {
    if (nextLocale === selectedLocale) {
      return;
    }

    const root = document.documentElement;
    root.lang = nextLocale;
    root.dir = getDirection(nextLocale);

    startTransition(() => {
      void router.push(pathname ?? "/", { locale: nextLocale });
    });
  };

  return (
    <div className="flex items-center gap-3">
      {roleBadge && (
        <Badge
          variant="secondary"
          className="hidden sm:flex items-center gap-1"
        >
          <Shield className="h-3 w-3" />
          {roleBadge}
        </Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full cursor-pointer"
            aria-label={
              unreadCount > 0
                ? t("header.avatarHasUnreadNotifications")
                : undefined
            }
          >
            {unreadCount > 0 ? (
              <span
                className="absolute inset-e-0 top-0 z-10 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background"
                aria-hidden
              />
            ) : null}
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image || ""} alt={user.name || ""} />
              <AvatarFallback className="text-xs">
                {user.name?.charAt(0)?.toUpperCase() ||
                  user.email?.charAt(0)?.toUpperCase() ||
                  "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.name || t("header.defaultUser")}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email ? user.email.replace(/^[^@]+/, "***") : ""}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {t("header.dashboardSection")}
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={getDashboardPathForRole(user.role)} className="cursor-pointer">
                <House className="mr-2 h-4 w-4" />
                {t("header.dashboard")}
              </Link>
            </DropdownMenuItem>

            {isAdmin ? (
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  {t("header.settings")}
                </Link>
              </DropdownMenuItem>
            ) : isRegularUser ? (
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  {t("header.settings")}
                </Link>
              </DropdownMenuItem>
            ) : null}

            {isRegularUser ? (
              <>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/notifications"
                    className="flex w-full cursor-pointer flex-col gap-0.5 items-stretch"
                  >
                    <span className="flex w-full items-center gap-2">
                      <Bell className="mr-2 h-4 w-4 shrink-0" />
                      <span className="flex-1 text-start">
                        {t("header.notifications")}
                      </span>
                      <NotificationMenuBadge />
                    </span>
                    {unreadCount > 0 ? (
                      <span className="ps-6 text-start text-xs text-muted-foreground">
                        {t("notifications.unreadSubtitle", { count: unreadCount })}
                      </span>
                    ) : null}
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/dashboard/newsletter" className="cursor-pointer">
                    <Mail className="mr-2 h-4 w-4" />
                    {t("header.newsletterChannel")}
                  </Link>
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuGroup>

          {isRegularUser ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {t("header.supportSection")}
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/support/" className="cursor-pointer">
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    {t("header.support")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/feedbacks" className="cursor-pointer">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {t("header.feedbacks")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          ) : null}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {t("header.preferencesSection")}
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() =>
                setTheme(selectedTheme === "dark" ? "light" : "dark")
              }
            >
              {selectedTheme === "dark" ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              {selectedTheme === "dark"
                ? t("header.switchToLight")
                : t("header.switchToDark")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() =>
                handleLocaleSwitch(selectedLocale === "ar" ? "en" : "ar")
              }
              disabled={isSwitchingLocale}
            >
              <Globe className="mr-2 h-4 w-4" />
              {selectedLocale === "ar"
                ? t("header.switchToEnglish")
                : t("header.switchToArabic")}
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isSigningOut ? t("header.signingOut") : t("header.signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
