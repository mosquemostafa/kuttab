"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormSuccess, FormError } from "@/components/ui/form-messages";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

const schema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const t = useTranslations("auth.forgot.form");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const [formState, setFormState] = useState<{
    success?: string;
    error?: string;
  }>({});

  const onSubmit = async (data: FormData) => {
    setFormState({});
    const { error } = await authClient.requestPasswordReset({
      email: data.email.trim().toLowerCase(),
    });

    if (!error) {
      setFormState({ success: t("success") });
      return;
    }

    setFormState({ error: error.message || t("errors.requestFailed") });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-5"
    >
      <FormSuccess message={formState.success || ""} />
      <FormError message={formState.error || ""} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          {...register("email")}
        />
        {errors.email && (
          <span className="text-xs text-red-500">{errors.email.message}</span>
        )}
      </div>

      <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>

      <div className="text-center text-sm">
        {t("backToLogin")}{" "}
        <Link
          href="/auth/login"
          className="text-primary underline hover:no-underline font-medium"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </form>
  );
}
