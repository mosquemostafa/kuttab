"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import PasswordInput from "./password-input";
import { registerSchema, type RegisterSchema } from "@/lib/schemas";
import { authClient } from "@/lib/auth-client";
import { FormSuccess, FormError } from "../ui/form-messages";

const RegisterForm = () => {
  const t = useTranslations("auth.register.form");

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
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: RegisterSchema) => {
    setFormState({});
    const { error } = await authClient.signUp.email({
      name: data.name,
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });

    if (!error) {
      setFormState({ success: t("successVerificationNeeded") });
    } else {
      if (
        error.status === 422 ||
        (error as { code?: string }).code === "USER_ALREADY_EXISTS"
      ) {
        setFormState({ error: t("errors.userExists") });
      } else if (error.status === 400) {
        setFormState({ error: t("errors.invalidEmail") });
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
