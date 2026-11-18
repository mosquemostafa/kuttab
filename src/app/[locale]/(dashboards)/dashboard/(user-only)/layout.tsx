import { auth } from "@/server/lib/auth";
import { headers } from "next/headers";
import { redirect } from "@/i18n/navigation";
import {
  UserRole,
  getDashboardPathForRole,
  normalizeUserRole,
} from "@/shared/enums/user-role.enum";

export default async function UserOnlyLayout({
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

  if (session?.user && normalizeUserRole(session.user.role) !== UserRole.USER) {
    redirect({ href: getDashboardPathForRole(session.user.role), locale });
    return null;
  }

  return <>{children}</>;
}
