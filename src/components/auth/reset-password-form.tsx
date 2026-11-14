"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import PasswordInput from "@/components/auth/password-input";
import { FormSuccess, FormError } from "@/components/ui/form-messages";
import { authClient } from "@/lib/auth-client";
import {
  passwordWithConfirmationSchema,
  type PasswordWithConfirmationSchema,
} from "@/lib/schemas";

export default function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth.reset.form");
  const router = useRouter();
  const [formState, setFormState] = useState<{
    success?: string;
    error?: string;
  }>({});

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PasswordWithConfirmationSchema>({
    resolver: zodResolver(passwordWithConfirmationSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: PasswordWithConfirmationSchema) => {
    setFormState({});

    const { error } = await authClient.resetPassword({
      token,
      newPassword: data.password,
    });

    if (!error) {
      setFormState({ success: t("success") });
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      url.searchParams.delete("callbackURL");
      window.history.replaceState({}, "", url.pathname + url.search);
      toast.success(t("success"));
      setTimeout(() => router.push("/auth/login"), 1000);
      return;
    }

    setFormState({ error: error.message || t("errors.invalidToken") });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-5"
    >
      <FormSuccess message={formState.success || ""} />
      <FormError message={formState.error || ""} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t("passwordLabel")}</Label>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <PasswordInput
              value={field.value}
              onChange={field.onChange}
              id="password"
            />
          )}
        />
        {errors.password && (
          <span className="text-xs text-red-500">
            {errors.password.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <PasswordInput
              value={field.value}
              onChange={field.onChange}
              id="confirmPassword"
            />
          )}
        />
        {errors.confirmPassword && (
          <span className="text-xs text-red-500">
            {errors.confirmPassword.message}
          </span>
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
