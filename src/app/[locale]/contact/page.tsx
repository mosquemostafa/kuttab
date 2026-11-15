import { getTranslations } from "next-intl/server";
import { ContactForm } from "./contact-form";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.contact" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.contact" });

  return (
    <div className="min-h-screen w-full bg-background flex flex-col justify-between">
      <PublicHeader />
      <main className="w-full pt-16 flex-1">
        <div className="container mx-auto px-4 py-20 max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
            <p className="text-muted-foreground text-lg">{t("description")}</p>
          </div>
          <ContactForm />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
