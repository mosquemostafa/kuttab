import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";

import { auth } from "@/server/lib/auth";
import { supportTicketService } from "@/server/modules/support-tickets/support-ticket.service";
import { UserRole } from "@/shared/enums/user-role.enum";
import { UserTicketDetailView } from "@/components/dashboard/support/user-ticket-detail-view";

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Support Ticket #${id.slice(-6)}`,
  };
}

export default async function UserSupportTicketDetailPage({
  params,
}: PageProps) {
  const { id, locale } = await params;
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }

  let ticket;
  try {
    ticket = await supportTicketService.getTicketById(
      id,
      session.user.id,
      session.user.role as UserRole,
    );
  } catch {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <UserTicketDetailView
        initialTicket={ticket}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </div>
  );
}
