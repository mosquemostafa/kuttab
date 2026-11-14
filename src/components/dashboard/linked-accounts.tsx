"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Link2, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { apiClient } from "@/lib/api/api-client";
import { useApiErrorMessage } from "@/lib/api/use-api-error-message";
import { authClient } from "@/lib/auth-client";
import { uploadUserAvatarFromFile } from "@/lib/assets/r2-avatar-upload";
import {
  AVATAR_ALLOWED_CONTENT_TYPES,
  AVATAR_MAX_UPLOAD_BYTES,
} from "@/shared/constants/avatar-r2.constants";

interface LinkedAccount {
  providerId: string;
  picture?: string;
}

const socialProviders = ["google", "github"] as const;

type LinkedAccountsProps = {
  currentImage?: string | null;
  userName: string;
  avatarR2UploadEnabled?: boolean;
};

export default function LinkedAccounts({
  currentImage,
  userName,
  avatarR2UploadEnabled = false,
}: LinkedAccountsProps) {
  const t = useTranslations("settings.linkedAccounts");
  const getErrorMessage = useApiErrorMessage();
  const router = useRouter();
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [linking, setLinking] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [currentProfileImage, setCurrentProfileImage] = useState<string | null>(
    currentImage ?? null,
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxMb = Math.round(AVATAR_MAX_UPLOAD_BYTES / (1024 * 1024));
  const acceptMime = AVATAR_ALLOWED_CONTENT_TYPES.join(",");
  const allowedMimeSet = new Set<string>(AVATAR_ALLOWED_CONTENT_TYPES);
  const socialAccounts = linkedAccounts.filter((account) =>
    socialProviders.includes(account.providerId as "google" | "github"),
  );

  useEffect(() => {
    setCurrentProfileImage(currentImage ?? null);
  }, [currentImage]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const accounts = await apiClient.dashboardSettings.getLinkedAccounts();
        setLinkedAccounts(accounts);
      } catch (error) {
        console.error(error);
        toast.error(t("messages.failedLoad"));
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const handleUpdateImage = async (providerId: string) => {
    setUpdating(providerId);
    try {
      await apiClient.dashboardSettings.updateImageFromProvider(providerId);

      const selectedProviderImage = socialAccounts.find(
        (account) => account.providerId === providerId,
      )?.picture;
      if (selectedProviderImage) {
        setCurrentProfileImage(selectedProviderImage);
      }
      toast.success(t("profileImage.uploadSuccess"));
      router.refresh();
    } catch (error) {
      console.error("Error updating image:", error);
      toast.error(getErrorMessage(error, t("messages.failedUpdateImage")));
    } finally {
      setUpdating(null);
    }
  };

  const handleAvatarFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!allowedMimeSet.has(file.type)) {
      toast.error(t("profileImage.invalidType", { maxMb }));
      return;
    }

    if (file.size > AVATAR_MAX_UPLOAD_BYTES) {
      toast.error(t("profileImage.tooLarge", { maxMb }));
      return;
    }

    setUploadingAvatar(true);
    setUploadProgress(0);
    try {
      const result = await uploadUserAvatarFromFile(file, (ratio) => {
        setUploadProgress(ratio);
      });
      setCurrentProfileImage(result.imageUrl);
      toast.success(t("profileImage.uploadSuccess"));
      router.refresh();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : t("profileImage.uploadFailed");
      toast.error(message);
    } finally {
      setUploadingAvatar(false);
      setUploadProgress(0);
    }
  };

  const openCurrentProfileImage = () => {
    if (!currentProfileImage) {
      return;
    }

    window.open(currentProfileImage, "_blank", "noopener,noreferrer");
  };

  const handleLinkAccount = async (providerId: "google" | "github") => {
    setLinking(providerId);
    try {
      const successCallbackURL = `${window.location.origin}/dashboard/settings?linked=success`;
      const errorCallbackURL = `${window.location.origin}/dashboard/settings`;

      const result = await apiClient.auth.linkSocial({
        provider: providerId,
        callbackURL: successCallbackURL,
        errorCallbackURL,
        disableRedirect: true,
      });

      if (!result.success) {
        toast.error(
          result.reason ||
            t("messages.failedLink", {
              provider:
                providerId === "google"
                  ? t("providers.google")
                  : t("providers.github"),
            }),
        );
        return;
      }

      if (!result.url) {
        toast.success(
          result.reason ||
            t("messages.alreadyLinked", {
              provider:
                providerId === "google"
                  ? t("providers.google")
                  : t("providers.github"),
            }),
        );
        router.refresh();
        return;
      }

      try {
        const oauthUrl = new URL(result.url);
        const redirectUri = oauthUrl.searchParams.get("redirect_uri");

        if (redirectUri) {
          const callbackOrigin = new URL(redirectUri).origin;
          const currentOrigin = window.location.origin;

          if (callbackOrigin !== currentOrigin) {
            toast.error(
              t("messages.callbackMismatch", {
                callbackOrigin,
                currentOrigin,
              }),
            );
            return;
          }
        }
      } catch {
        toast.error(t("messages.invalidRedirectUrl"));
        return;
      }

      window.location.href = result.url;
    } catch (error) {
      console.error("Error linking account:", error);
      toast.error(
        t("messages.failedLink", {
          provider:
            providerId === "google"
              ? t("providers.google")
              : t("providers.github"),
        }),
      );
      return;
    } finally {
      setLinking(null);
    }
  };

  const handleDisconnectAccount = async (providerId: "google" | "github") => {
    if (linkedAccounts.length <= 1) {
      toast.error(t("messages.keepOneMethod"));
      return;
    }

    setDisconnecting(providerId);
    try {
      const result = await authClient.unlinkAccount({
        providerId,
      });

      if (result.error) {
        const message = String(result.error.message || "");
        if (message.toLowerCase().includes("last account")) {
          toast.error(t("messages.keepOneMethod"));
        } else {
          toast.error(t("messages.failedDisconnect"));
        }
        return;
      }

      setLinkedAccounts((prev) =>
        prev.filter((a) => a.providerId !== providerId),
      );
      toast.success(
        t("messages.disconnected", {
          provider:
            providerId === "google"
              ? t("providers.google")
              : t("providers.github"),
        }),
      );
      router.refresh();
    } catch (error) {
      console.error("Error disconnecting account:", error);
      toast.error(t("messages.failedDisconnect"));
    } finally {
      setDisconnecting(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex min-w-0 gap-4">
            <div
              className="hidden size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary sm:flex"
              aria-hidden
            >
              <Link2 className="size-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="size-16 rounded-full" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-44" />

            {socialProviders.map((providerId) => (
              <div
                key={providerId}
                className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-9 w-full sm:w-36" />
              </div>
            ))}
          </div>
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
            <Link2 className="size-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("profileImage.current")}</p>
          {avatarR2UploadEnabled ? (
            <div className="relative inline-flex">
              <button
                type="button"
                className="group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={openCurrentProfileImage}
                aria-label={t("profileImage.current")}
              >
                <Avatar className="h-16 w-16 transition-transform duration-200 group-hover:scale-[1.02]">
                  <AvatarImage src={currentProfileImage || undefined} />
                  <AvatarFallback>
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute inset-0 rounded-full bg-background/0 transition-colors duration-200 group-hover:bg-background/10" />
              </button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -right-1 -bottom-1 h-7 w-7 rounded-full shadow-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label={t("profileImage.uploadButton")}
              >
                <PencilLine className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Avatar className="h-16 w-16">
              <AvatarImage src={currentProfileImage || undefined} />
              <AvatarFallback>
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {avatarR2UploadEnabled ? (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptMime}
              className="sr-only"
              aria-hidden
              tabIndex={-1}
              onChange={handleAvatarFileSelected}
            />
            {uploadingAvatar && uploadProgress > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(uploadProgress * 100)}%
              </span>
            )}
          </div>
        ) : null}

        <div className="space-y-3">
          <p className="text-sm font-medium">{t("profileImage.providers")}</p>
          {socialProviders.map((providerId) => {
            const account = socialAccounts.find(
              (item) => item.providerId === providerId,
            );
            const isConnected = Boolean(account);
            const providerImage = account?.picture;

            return (
              <div
                key={providerId}
                className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  {providerImage ? (
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={providerImage} />
                      <AvatarFallback>
                        {providerId.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        {providerId.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="text-sm">
                    <p className="font-medium">
                      {providerId === "google"
                        ? t("providers.google")
                        : t("providers.github")}
                    </p>
                    {!isConnected && (
                      <p className="text-xs text-muted-foreground">
                        {t("status.notConnected")}
                      </p>
                    )}
                    {isConnected && providerImage && (
                      <p className="text-xs text-muted-foreground">
                        {t("status.connectedWithImage")}
                      </p>
                    )}
                    {isConnected && !providerImage && (
                      <p className="text-xs text-muted-foreground">
                        {t("status.connectedWithoutImage")}
                      </p>
                    )}
                  </div>
                </div>

                {!isConnected ? (
                  <Button
                    onClick={() => handleLinkAccount(providerId)}
                    disabled={linking === providerId}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    {linking === providerId
                      ? t("buttonStates.linking")
                      : t("actions.linkAccount", {
                          provider:
                            providerId === "google"
                              ? t("providers.google")
                              : t("providers.github"),
                        })}
                  </Button>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-0 sm:flex-nowrap">
                    <Button
                      onClick={() => handleUpdateImage(providerId)}
                      disabled={!providerImage || updating === providerId}
                    >
                      {updating === providerId
                        ? t("buttonStates.updating")
                        : t("actions.useImage")}
                    </Button>
                    <Button
                      onClick={() => handleDisconnectAccount(providerId)}
                      disabled={
                        disconnecting === providerId ||
                        linkedAccounts.length <= 1
                      }
                      size="sm"
                      variant="outline"
                    >
                      {disconnecting === providerId
                        ? t("buttonStates.disconnecting")
                        : t("actions.disconnect")}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
