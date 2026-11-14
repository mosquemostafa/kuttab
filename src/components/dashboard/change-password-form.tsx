"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, KeyRound } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import PasswordInput from "@/components/auth/password-input";
import {
  changePasswordSchema,
  setPasswordSchema,
  type ChangePasswordSchema,
  type SetPasswordSchema,
} from "@/lib/schemas";
import { apiClient } from "@/lib/api/api-client";
import { useApiErrorMessage } from "@/lib/api/use-api-error-message";

type ChangePasswordFormProps = {
  hasPasswordLogin: boolean;
};

export default function ChangePasswordForm({
  hasPasswordLogin,
}: ChangePasswordFormProps) {
  const t = useTranslations("settings.changePassword");
  const getErrorMessage = useApiErrorMessage();
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] =
    useState(false);

  const changePasswordForm = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const setPasswordForm = useForm<SetPasswordSchema>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = changePasswordForm;

  const {
    handleSubmit: handleSetSubmit,
    reset: resetSet,
    control: setControl,
    formState: { errors: setErrors, isSubmitting: isSetSubmitting },
  } = setPasswordForm;

  const onSubmit = async (data: ChangePasswordSchema) => {
    try {
      await apiClient.dashboardSettings.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success(t("messages.passwordUpdated"));
      reset();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onSetPasswordSubmit = async (data: SetPasswordSchema) => {
    try {
      await apiClient.dashboardSettings.setPassword({
        newPassword: data.newPassword,
      });
      toast.success(t("messages.passwordEnabled"));
      resetSet();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (!hasPasswordLogin) {
    return (
      <Card>
        <CardHeader>
          <div className="flex min-w-0 gap-4">
            <div
              className="hidden size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary sm:flex"
              aria-hidden
            >
              <KeyRound className="size-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle>{t("modal.enableTitle")}</CardTitle>
              <CardDescription>{t("modal.enableDescription")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSetSubmit(onSetPasswordSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="set-password">{t("fields.newPassword")}</Label>
              <Controller
                name="newPassword"
                control={setControl}
                render={({ field }) => (
                  <PasswordInput
                    id="set-password"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {setErrors.newPassword && (
                <span className="text-xs text-red-500">
                  {setErrors.newPassword.message}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="set-confirm-password">
                {t("fields.confirmPassword")}
              </Label>
              <Controller
                name="confirmPassword"
                control={setControl}
                render={({ field }) => (
                  <PasswordInput
                    id="set-confirm-password"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {setErrors.confirmPassword && (
                <span className="text-xs text-red-500">
                  {setErrors.confirmPassword.message}
                </span>
              )}
            </div>

            <Button type="submit" disabled={isSetSubmitting}>
              {isSetSubmitting
                ? t("buttonStates.enabling")
                : t("actions.enablePasswordLogin")}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 gap-4">
          <div
            className="hidden size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary sm:flex"
            aria-hidden
          >
            <KeyRound className="size-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">
              {t("fields.currentPassword")}
            </Label>
            <div className="relative">
              <Input
                id="current-password"
                type={isCurrentPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                placeholder={t("fields.currentPasswordPlaceholder")}
                className="pe-9"
                {...register("currentPassword")}
              />
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 inset-e-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px]"
                type="button"
                onClick={() =>
                  setIsCurrentPasswordVisible((prevState) => !prevState)
                }
                aria-label={
                  isCurrentPasswordVisible
                    ? t("actions.hideCurrentPassword")
                    : t("actions.showCurrentPassword")
                }
                aria-pressed={isCurrentPasswordVisible}
                aria-controls="current-password"
              >
                {isCurrentPasswordVisible ? (
                  <EyeOffIcon size={16} aria-hidden="true" />
                ) : (
                  <EyeIcon size={16} aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <span className="text-xs text-red-500">
                {errors.currentPassword.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">{t("fields.newPassword")}</Label>
            <Controller
              name="newPassword"
              control={control}
              render={({ field }) => (
                <PasswordInput
                  id="new-password"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.newPassword && (
              <span className="text-xs text-red-500">
                {errors.newPassword.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">
              {t("fields.confirmPassword")}
            </Label>
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <PasswordInput
                  id="confirm-new-password"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.confirmPassword && (
              <span className="text-xs text-red-500">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t("buttonStates.updating")
              : t("actions.updatePassword")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
