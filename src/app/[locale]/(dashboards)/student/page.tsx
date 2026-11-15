import { redirect } from "next/navigation";

const StudentPage = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;
  redirect(`/${locale}/student/overview`);
};

export default StudentPage;
