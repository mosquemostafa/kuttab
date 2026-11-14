import { redirect } from "next/navigation";

const SupportPage = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;
  redirect(`/${locale}/support/overview`);
};

export default SupportPage;
