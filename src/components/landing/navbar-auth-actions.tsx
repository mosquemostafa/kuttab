"use client";

import { useTranslations } from "next-intl";
import { House, LogOut, Settings } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { useSignOut } from "@/hooks/use-sign-out";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarAuthActionsProps {
  isMobile?: boolean;
  shouldCheckAuth?: boolean;
}

function StaticAuthActions({ isMobile }: { isMobile: boolean }) {
  const t = useTranslations("header");

  if (isMobile) {
    return (
      <Button asChild size="sm" className="cursor-pointer">
        <Link href="/auth/login" prefetch={false}>
          {t("signIn")}
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href="/auth/login" prefetch={false}>
          {t("signIn")}
        </Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/auth/register" prefetch={false}>
          {t("signUp")}
        </Link>
      </Button>
    </div>
  );
}

function DynamicAuthActions({ isMobile }: { isMobile: boolean }) {
  const t = useTranslations("header");
  const { data: session, isPending } = authClient.useSession();
  const { handleSignOut, isSigningOut } = useSignOut();

  // 1. Loading skeleton (avoids layout shift and hydration mismatch)
  if (isPending) {
    return isMobile ? (
      <Skeleton className="h-8 w-16 rounded-md" />
    ) : (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    );
  }

  // 2. Authenticated user
  if (session?.user) {
    const user = session.user;
    const initials = (user.name || user.email || "U").slice(0, 2).toUpperCase();

    if (isMobile) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full p-0"
            >
              <Avatar className="h-8 w-8">
                {user.image && (
                  <AvatarImage src={user.image} alt={user.name || ""} />
                )}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate">
                  {user.name || t("defaultUser")}
                </p>
                {user.email && (
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user.email}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/overview"
                prefetch={false}
                className="cursor-pointer"
              >
                <House className="me-2 h-4 w-4" />
                <span>{t("dashboard")}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/settings"
                prefetch={false}
                className="cursor-pointer"
              >
                <Settings className="me-2 h-4 w-4" />
                <span>{t("settings")}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="me-2 h-4 w-4" />
              <span>{t("signOut")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <Button asChild size="sm">
          <Link href="/dashboard/overview" prefetch={false}>
            {t("dashboard")}
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full p-0"
            >
              <Avatar className="h-8 w-8">
                {user.image && (
                  <AvatarImage src={user.image} alt={user.name || ""} />
                )}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate">
                  {user.name || t("defaultUser")}
                </p>
                {user.email && (
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user.email}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/overview"
                prefetch={false}
                className="cursor-pointer"
              >
                <House className="me-2 h-4 w-4" />
                <span>{t("dashboard")}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/settings"
                prefetch={false}
                className="cursor-pointer"
              >
                <Settings className="me-2 h-4 w-4" />
                <span>{t("settings")}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="me-2 h-4 w-4" />
              <span>{t("signOut")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // 3. Unauthenticated user
  return <StaticAuthActions isMobile={isMobile} />;
}

export function NavbarAuthActions({
  isMobile = false,
  shouldCheckAuth = false,
}: NavbarAuthActionsProps) {
  if (!shouldCheckAuth) {
    return <StaticAuthActions isMobile={isMobile} />;
  }

  return <DynamicAuthActions isMobile={isMobile} />;
}
