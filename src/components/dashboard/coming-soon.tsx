import { Clock3 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function ComingSoon() {
  const t = await getTranslations("dashboard.comingSoon");

  return (
    <section className="mx-auto w-full max-w-3xl py-10">
      <Card className="border-dashed">
        <CardHeader className="flex items-center gap-3 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Clock3 aria-hidden />
          </div>
          <div className="flex flex-col items-start  gap-2">
            <Badge variant="secondary">{t("badge")}</Badge>
            <CardTitle className="text-2xl tracking-tight">
              {t("title")}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="text-center">
          <p className="text-muted-foreground">{t("description")}</p>
        </CardContent>
      </Card>
    </section>
  );
}
