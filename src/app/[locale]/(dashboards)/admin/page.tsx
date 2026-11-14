import { redirect } from "next/navigation";

const AdminPage = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;
  redirect(`/${locale}/admin/overview`);
};

export default AdminPage;
