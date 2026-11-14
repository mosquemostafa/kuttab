import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NotFound() {
  const t = await getTranslations("common.notFound");

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <Card className="w-full max-w-xl border-border/60 bg-card/90 backdrop-blur-sm">
        <CardHeader className="flex flex-col items-center text-center">
          <span className="mx-auto mb-3 inline-flex items-center justify-center rounded-4xl px-3 py-2 text-6xl font-extrabold text-secondary-foreground">
            404
          </span>
          <CardTitle className="mt-4 text-2xl tracking-tight sm:text-3xl">
            {t("title")}
          </CardTitle>
          <CardDescription className="mx-auto mt-2 max-w-md text-balance">
            {t("description")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            {t("hint")}
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-center">
          <Button asChild>
            <Link
              href="/dashboard/overview"
              className="inline-flex items-center gap-2"
            >
              <Home data-icon="inline-start" />
              {t("goHome")}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
