"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { useRouter, Link } from "@/i18n/navigation";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/config";
import {
  getDashboardPathForRole,
  isAllowedDashboardForRole,
} from "@/shared/enums/user-role.enum";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import { FormSuccess, FormError } from "../ui/form-messages";

type FormData = {
  email: string;
  password: string;
};

type LoginFormProps = {
  /** Sanitized internal path (e.g. from `?callbackUrl=`). */
  redirectAfterLogin?: string | null;
};

const LoginForm = ({ redirectAfterLogin }: LoginFormProps) => {
  const t = useTranslations("auth.login.form");

  const loginSchema = z.object({
    email: z.string().email({ message: t("errors.invalidEmail") }),
    password: z.string().min(1, { message: t("errors.passwordRequired") }),
  });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const [formState, setFormState] = useState<{
    success?: string;
    error?: string;
    needsEmailVerification?: boolean;
    emailToVerify?: string;
  }>({});

  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    setFormState({});
    const { data: authData, error } = await authClient.signIn.email({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });

    if (!error) {
      setFormState({ success: t("success") });
      const role = (authData as { user?: { role?: string | null } } | null)
        ?.user?.role;
      const roleDashboard = getDashboardPathForRole(role);
      const destination =
        redirectAfterLogin &&
        isAllowedDashboardForRole(role, redirectAfterLogin)
          ? redirectAfterLogin
          : roleDashboard;
      router.push(destination);
    } else {
      const isForbiddenOrUnverified =
        error.status === 403 ||
        error.message?.toLowerCase().includes("verification") ||
        error.message?.toLowerCase().includes("verify");

      if (isForbiddenOrUnverified) {
        setFormState({
          error: t("errors.emailNotVerified"),
          needsEmailVerification: true,
          emailToVerify: data.email.trim().toLowerCase(),
        });
      } else if (error.status === 401) {
        setFormState({
          error: t("errors.invalidCredentials"),
        });
      } else {
        setFormState({
          error: error.message || t("errors.generic"),
        });
      }
    }
  };

  const handleResendVerification = async () => {
    const email = formState.emailToVerify || getValues("email");
    if (!email) {
      return;
    }

    setIsResendingVerification(true);

    try {
      const { error } = await authClient.sendVerificationEmail({
        email: email.trim().toLowerCase(),
        callbackURL: redirectAfterLogin ?? DEFAULT_LOGIN_REDIRECT,
      });

      if (!error) {
        setFormState((prev) => ({
          ...prev,
          success: t("successVerificationSent"),
          error: undefined,
        }));
      } else {
        setFormState((prev) => ({
          ...prev,
          error: error.message || t("errors.generic"),
        }));
      }
    } catch {
      setFormState((prev) => ({
        ...prev,
        error: t("errors.generic"),
      }));
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <form
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-5"
    >
      <FormSuccess message={formState.success || ""} />
      <FormError message={formState.error || ""} />
      {formState.needsEmailVerification ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {t("verificationSpamNote")}
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResendVerification}
            disabled={isSubmitting || isResendingVerification}
          >
            {t("resendVerificationEmail")}
          </Button>
        </div>
      ) : null}
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
          <span className="text-xs text-red-500">{errors.email.message}</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t("passwordLabel")}</Label>
        <div className="relative">
          <Input
            id="password"
            type={isVisible ? "text" : "password"}
            placeholder={t("passwordPlaceholder")}
            autoComplete="current-password"
            className="pe-9"
            {...register("password")}
          />
          <button
            className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 inset-e-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            type="button"
            onClick={toggleVisibility}
            aria-label={
              isVisible
                ? t("hidePasswordAriaLabel")
                : t("showPasswordAriaLabel")
            }
            aria-pressed={isVisible}
            aria-controls="password"
          >
            {isVisible ? (
              <EyeOffIcon size={16} aria-hidden="true" />
            ) : (
              <EyeIcon size={16} aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <span className="text-xs text-red-500">
            {errors.password.message}
          </span>
        )}
        <Link
          href="/auth/forgot-password"
          className="text-xs text-primary underline hover:no-underline self-end"
        >
          {t("forgotPassword")}
        </Link>
      </div>
      <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
};

export default LoginForm;
