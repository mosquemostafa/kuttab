import { redirect } from "next/navigation";

export default async function DashboardLearningPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard-learning/overview`);
}
