import { redirect } from "next/navigation";

const ParentPage = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;
  redirect(`/${locale}/parent/overview`);
};

export default ParentPage;
