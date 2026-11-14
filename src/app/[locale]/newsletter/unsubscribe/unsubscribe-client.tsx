"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { apiClient } from "@/lib/api/api-client";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Preview = {
  emailMasked: string;
  alreadyUnsubscribed: boolean;
};

export function NewsletterUnsubscribeClient({
  token,
  preview,
}: {
  token: string;
  preview: Preview;
}) {
  const t = useTranslations("newsletter.unsubscribe");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (preview.alreadyUnsubscribed) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>{t("alreadyTitle")}</CardTitle>
          <CardDescription>{t("alreadyBody")}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline">
            <Link href="/">{t("cancel")}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const confirm = async () => {
    setLoading(true);
    try {
      await apiClient.newsletter.unsubscribe(token);
      router.push("/newsletter/unsubscribed");
    } catch {
      toast.error(t("invalidToken"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>{t("pageTitle")}</CardTitle>
        <CardDescription>
          {t("intro")}{" "}
          <span className="font-medium">{preview.emailMasked}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button onClick={confirm} disabled={loading} variant="destructive">
          {t("confirm")}
        </Button>
      </CardContent>
      <CardFooter>
        <Button asChild variant="ghost">
          <Link href="/">{t("cancel")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
