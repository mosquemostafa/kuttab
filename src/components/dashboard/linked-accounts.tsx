"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PencilLine, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { uploadUserAvatarFromFile } from "@/lib/assets/r2-avatar-upload";
import {
  AVATAR_ALLOWED_CONTENT_TYPES,
  AVATAR_MAX_UPLOAD_BYTES,
} from "@/shared/constants/avatar-r2.constants";

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
  const router = useRouter();
  const [currentProfileImage, setCurrentProfileImage] = useState<string | null>(
    currentImage ?? null,
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxMb = Math.round(AVATAR_MAX_UPLOAD_BYTES / (1024 * 1024));
  const acceptMime = AVATAR_ALLOWED_CONTENT_TYPES.join(",");
  const allowedMimeSet = new Set<string>(AVATAR_ALLOWED_CONTENT_TYPES);

  useEffect(() => {
    setCurrentProfileImage(currentImage ?? null);
  }, [currentImage]);

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
      </CardContent>
    </Card>
  );
}
