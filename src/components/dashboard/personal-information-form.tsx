"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserRound } from "lucide-react";

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
import {
  personalInformationSchema,
  type PersonalInformationSchema,
} from "@/lib/schemas";
import { apiClient } from "@/lib/api/api-client";
import { useApiErrorMessage } from "@/lib/api/use-api-error-message";

type PersonalInformationFormProps = {
  initialValues: {
    name: string;
    email: string;
  };
};

export default function PersonalInformationForm({
  initialValues,
}: PersonalInformationFormProps) {
  const t = useTranslations("settings.personalInformation");
  const getErrorMessage = useApiErrorMessage();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PersonalInformationSchema>({
    resolver: zodResolver(personalInformationSchema),
    defaultValues: {
      name: initialValues.name,
    },
  });

  useEffect(() => {
    reset({ name: initialValues.name });
  }, [initialValues.name, reset]);

  const onSubmit = async (data: PersonalInformationSchema) => {
    try {
      await apiClient.dashboardSettings.updateProfile({ name: data.name });
      toast.success(t("updatedSuccess"));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 gap-4">
          <div
            className="hidden size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary sm:flex"
            aria-hidden
          >
            <UserRound className="size-5" strokeWidth={1.75} />
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
            <Label htmlFor="settings-name">{t("fields.name")}</Label>
            <Input
              id="settings-name"
              placeholder={t("fields.namePlaceholder")}
              autoComplete="name"
              {...register("name")}
            />
            {errors.name && (
              <span className="text-xs text-red-500">
                {errors.name.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-email">{t("fields.email")}</Label>
            <Input
              id="settings-email"
              type="email"
              value={initialValues.email}
              disabled
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              {t("fields.emailHelp")}
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("actions.saving") : t("actions.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
