"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { authClient } from "@/lib/auth-client";
import { unregisterFcmCurrentDeviceBeforeSignOut } from "@/lib/fcm-unregister-current-device";

export function useSignOut() {
  const router = useRouter();
  const t = useTranslations("header");
  const { signOut } = authClient;
  const [isSigningOut, setIsSigningOut] = useState(false);

  const redirectTo = "/auth/login";

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      await unregisterFcmCurrentDeviceBeforeSignOut();

      const res = await signOut();

      if (res?.error) {
        toast.error(res.error.message || t("signOutFailed"));
        return;
      }

      toast.success(t("signOutSuccess"));

      if (typeof window !== "undefined") {
        window.sessionStorage.clear();
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      toast.error(t("signOutFailed"));
    } finally {
      setIsSigningOut(false);
    }
  };

  return {
    isSigningOut,
    handleSignOut,
  };
}
