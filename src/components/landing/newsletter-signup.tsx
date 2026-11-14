"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Mail, Send } from "lucide-react";
import toast from "react-hot-toast";

import { apiClient } from "@/lib/api/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterSignup() {
  const t = useTranslations("newsletter.signup");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.newsletter.subscribe({
        email,
        locale: locale === "ar" || locale === "en" ? locale : undefined,
      });
      toast.success(t("success"));
      setEmail("");
    } catch {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-xs backdrop-blur-xs sm:p-8 md:p-10"
      role="region"
      aria-label={t("title")}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="flex min-w-0 gap-4 lg:max-w-lg">
          <div
            className="hidden size-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-primary/10 text-primary shadow-xs sm:flex"
            aria-hidden
          >
            <Mail className="size-6" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {t("title")}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("description")}
            </p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-stretch lg:w-auto lg:max-w-md lg:flex-1 xl:max-w-lg"
        >
          <Input
            type="email"
            name="email"
            autoComplete="email"
            required
            aria-label={t("emailLabel")}
            placeholder={t("emailLabel")}
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className="h-11 border-border/70 bg-background/90 px-4 sm:flex-1 rounded-xl"
          />
          <Button
            type="submit"
            disabled={loading}
            className="h-11 shrink-0 px-6 font-semibold gap-2 rounded-xl cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{t("submit")}</span>
              </>
            ) : (
              <>
                <span>{t("submit")}</span>
                <Send className="size-3.5" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
