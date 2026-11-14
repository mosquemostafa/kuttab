import { redirect } from "next/navigation";

const ContentPage = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;
  redirect(`/${locale}/content/overview`);
};

export default ContentPage;
