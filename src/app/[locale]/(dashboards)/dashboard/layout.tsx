import { auth } from "@/server/lib/auth";
import {
  hasStaleSessionCookie,
  redirectThroughStaleSessionClear,
} from "@/server/lib/clear-stale-better-auth-session";
import { redirect } from "@/i18n/navigation";
import { headers } from "next/headers";
import { UserRole, normalizeUserRole } from "@/shared/enums/user-role.enum";
import DashboardLayout, {
  type DashboardShellMode,
} from "@/components/admin/dashboard-layout";
import { AnnouncementProvider } from "@/components/announcements/announcement-provider";
import { NotificationProvider } from "@/components/notifications/notification-provider";

export default async function Layout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    if (hasStaleSessionCookie(headersList, session)) {
      redirectThroughStaleSessionClear(`/${locale}/auth/login`);
    }
    redirect({ href: "/auth/login", locale });
    return null;
  }

  const normalizedRole = normalizeUserRole(session.user.role);
  const shellMode: DashboardShellMode =
    normalizedRole === UserRole.USER
      ? "dashboard"
      : (normalizedRole as DashboardShellMode);

  return (
    <AnnouncementProvider>
      <NotificationProvider>
        <DashboardLayout
          mode={shellMode}
          user={session.user}
          showInstallPwaBanner
        >
          {children}
        </DashboardLayout>
      </NotificationProvider>
    </AnnouncementProvider>
  );
}
