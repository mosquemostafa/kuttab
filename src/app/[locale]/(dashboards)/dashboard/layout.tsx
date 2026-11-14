import { auth } from "@/server/lib/auth";
import {
  hasStaleSessionCookie,
  redirectThroughStaleSessionClear,
} from "@/server/lib/clear-stale-better-auth-session";
import { redirect } from "@/i18n/navigation";
import { headers } from "next/headers";
import DashboardLayout from "@/components/admin/dashboard-layout";
import { AnnouncementProvider } from "@/components/announcements/announcement-provider";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { ProjectsStoreInitializer } from "@/components/projects/projects-store";
import { SubscriptionProvider } from "@/components/subscription/subscription-provider";

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

  if (!session.user.onboarded) {
    redirect({ href: "/welcome", locale });
    return null;
  }

  return (
    <AnnouncementProvider>
      <NotificationProvider>
        <SubscriptionProvider>
          <ProjectsStoreInitializer>
            <DashboardLayout
              mode="dashboard"
              user={session.user}
              showInstallPwaBanner
            >
              {children}
            </DashboardLayout>
          </ProjectsStoreInitializer>
        </SubscriptionProvider>
      </NotificationProvider>
    </AnnouncementProvider>
  );
}
