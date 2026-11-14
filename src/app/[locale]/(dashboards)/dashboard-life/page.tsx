import { redirect } from "next/navigation";

export default async function DashboardLifePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard-life/overview`);
}
