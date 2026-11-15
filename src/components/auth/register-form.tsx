"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import PasswordInput from "./password-input";
import { registerSchema, type RegisterSchema } from "@/lib/schemas";
import { authClient } from "@/lib/auth-client";
import { FormSuccess, FormError } from "../ui/form-messages";

const RegisterForm = () => {
  const t = useTranslations("auth.register.form");
  const router = useRouter();

  const [formState, setFormState] = React.useState<{
    success?: string;
    error?: string;
  }>({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "", password: "" },
  });

  const onSubmit = async (data: RegisterSchema) => {
    setFormState({});
    const res = await authClient.signUp.email({
      name: data.name,
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      password: data.password,
    });

    if (!res.error) {
      if (res.data?.token || res.data?.user?.emailVerified) {
        setFormState({ success: t("successAutoVerified") });
        router.push(DEFAULT_LOGIN_REDIRECT);
        router.refresh();
      } else {
        setFormState({ success: t("successVerificationNeeded") });
      }
    } else {
      const error = res.error;
      if (
        error.status === 422 ||
        (error as { code?: string }).code === "USER_ALREADY_EXISTS"
      ) {
        setFormState({ error: t("errors.userExists") });
      } else if (error.status === 400) {
        setFormState({ error: t("errors.invalidEmail") });
      } else if (error.status === 403) {
        setFormState({
          error: error.message || t("errors.registrationDisabled"),
        });
      } else {
        setFormState({ error: error.message || t("errors.generic") });
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-5"
    >
      {formState.success ? (
        <div className="space-y-2">
          <FormSuccess message={formState.success} />
          {formState.success === t("successVerificationNeeded") ? (
            <p className="text-xs text-muted-foreground">
              {t("verificationSpamNote")}
            </p>
          ) : null}
        </div>
      ) : null}
      <FormError message={formState.error || ""} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input
          id="name"
          type="text"
          placeholder={t("namePlaceholder")}
          autoComplete="name"
          {...register("name")}
        />
        {errors.name && (
          <span className="text-xs text-red-500">{t("errors.name")}</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          dir="ltr"
          type="email"
          placeholder={t("emailPlaceholder")}
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <span className="text-xs text-red-500">{t("errors.email")}</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">{t("phoneLabel")}</Label>
        <Input
          id="phone"
          dir="ltr"
          type="tel"
          inputMode="numeric"
          maxLength={11}
          placeholder={t("phonePlaceholder")}
          autoComplete="tel"
          {...register("phone", {
            onChange: (e) => {
              e.target.value = e.target.value
                .replace(/[٠-٩]/g, (d: string) =>
                  (d.charCodeAt(0) - 1632).toString(),
                )
                .replace(/\D/g, "")
                .slice(0, 11);
            },
          })}
        />
        {errors.phone && (
          <span className="text-xs text-red-500">{t("errors.phone")}</span>
        )}
      </div>
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
              placeholder={t("passwordPlaceholder")}
              showPasswordLabel={t("showPasswordAriaLabel")}
              hidePasswordLabel={t("hidePasswordAriaLabel")}
            />
          )}
        />
        {errors.password && (
          <span className="text-xs text-red-500">{t("errors.password")}</span>
        )}
      </div>
      <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
};

export default RegisterForm;
