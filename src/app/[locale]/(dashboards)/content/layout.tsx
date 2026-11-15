import { auth } from "@/server/lib/auth";
import {
  hasStaleSessionCookie,
  redirectThroughStaleSessionClear,
} from "@/server/lib/clear-stale-better-auth-session";
import { UserRole, normalizeUserRole } from "@/shared/enums/user-role.enum";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import DashboardLayout from "@/components/admin/dashboard-layout";

export default async function ContentLayout({
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

  if (!session?.user) {
    if (hasStaleSessionCookie(headersList, session)) {
      redirectThroughStaleSessionClear(`/${locale}/auth/login`);
    }
    return notFound();
  }

  if (normalizeUserRole(session.user.role) !== UserRole.CONTENT) {
    return notFound();
  }

  return (
    <DashboardLayout mode="content" user={session.user}>
      {children}
    </DashboardLayout>
  );
}
