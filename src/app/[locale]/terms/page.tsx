import { getTranslations } from "next-intl/server";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

interface Section {
  title: string;
  content: string[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.terms" });

  return {
    title: t("title"),
    description: t("intro.p1"),
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.terms" });

  const introList = [t("intro.p1"), t("intro.p2"), t("intro.p3")];

  const sectionList: Section[] = [
    {
      title: t("sections.s1.title"),
      content: [t("sections.s1.content.p1"), t("sections.s1.content.p2")],
    },
    {
      title: t("sections.s2.title"),
      content: [
        t("sections.s2.content.p1"),
        t("sections.s2.content.p2"),
        t("sections.s2.content.p3"),
      ],
    },
    {
      title: t("sections.s3.title"),
      content: [
        t("sections.s3.content.p1"),
        t("sections.s3.content.p2"),
        t("sections.s3.content.p3"),
        t("sections.s3.content.p4"),
        t("sections.s3.content.p5"),
        t("sections.s3.content.p6"),
      ],
    },
    {
      title: t("sections.s4.title"),
      content: [
        t("sections.s4.content.p1"),
        t("sections.s4.content.p2"),
        t("sections.s4.content.p3"),
      ],
    },
    {
      title: t("sections.s5.title"),
      content: [
        t("sections.s5.content.p1"),
        t("sections.s5.content.p2"),
        t("sections.s5.content.p3"),
      ],
    },
    {
      title: t("sections.s6.title"),
      content: [t("sections.s6.content.p1"), t("sections.s6.content.p2")],
    },
    {
      title: t("sections.s7.title"),
      content: [t("sections.s7.content.p1"), t("sections.s7.content.p2")],
    },
    {
      title: t("sections.s8.title"),
      content: [t("sections.s8.content.p1"), t("sections.s8.content.p2")],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-background flex flex-col justify-between">
      <PublicHeader />
      <main className="w-full pt-16 flex-1">
        <div className="container mx-auto px-4 py-20 max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
          <p className="text-muted-foreground mb-10">{t("lastUpdated")}</p>

          <div className="space-y-4 mb-10 text-foreground/80 leading-relaxed">
            {introList.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="space-y-10 text-foreground/80 leading-relaxed">
            {sectionList.map((section, index) => (
              <section key={index}>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.content.map((paragraph, pIndex) => {
                    const isBullet = paragraph.trim().startsWith("•");
                    if (isBullet) {
                      return (
                        <div
                          key={pIndex}
                          className="flex items-start gap-3 ms-2"
                        >
                          <span className="mt-2.5 size-1.5 rounded-full bg-foreground/60 shrink-0" />
                          <span>{paragraph.replace("•", "").trim()}</span>
                        </div>
                      );
                    }
                    return <p key={pIndex}>{paragraph}</p>;
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
