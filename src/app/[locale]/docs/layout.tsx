import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { privateSurfaceRobots } from "@/lib/seo/private-surface-robots";
import { auth } from "@/server/lib/auth";
import {
  hasStaleSessionCookie,
  redirectThroughStaleSessionClear,
} from "@/server/lib/clear-stale-better-auth-session";
import { UserRole } from "@/shared/enums/user-role.enum";

export function generateMetadata(): Metadata {
  return { robots: privateSurfaceRobots };
}

export default async function DocsLayout({
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

  if (session.user.role !== UserRole.ADMIN) {
    return notFound();
  }

  return <>{children}</>;
}
