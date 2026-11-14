"use client";

import { useCallback, useEffect, useState } from "react";
import { getToken } from "firebase/messaging";

import { ensureMessagingServiceWorker } from "@/lib/ensure-fcm-service-worker";
import { getFirebaseMessaging } from "@/lib/firebase-client";

type UseFcmState = {
  isSupported: boolean;
  isLoading: boolean;
  permission: NotificationPermission | "unsupported";
  token: string | null;
  error: string | null;
};

const DEFAULT_STATE: UseFcmState = {
  isSupported: false,
  isLoading: false,
  permission: "unsupported",
  token: null,
  error: null,
};

function resolveInitialPermission(): NotificationPermission | "unsupported" {
  // Keep SSR and first client render identical to avoid hydration mismatch.
  // Actual permission is synchronized in the support-detection effect below.
  return "unsupported";
}

export function useFcm() {
  const [state, setState] = useState<UseFcmState>({
    ...DEFAULT_STATE,
    permission: resolveInitialPermission(),
  });

  // Detect runtime support asynchronously, sync current permission, and warm up SW registration.
  useEffect(() => {
    let isMounted = true;

    async function checkSupport() {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        !("serviceWorker" in navigator)
      ) {
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            isSupported: false,
            permission: "unsupported",
          }));
        }
        return;
      }

      const msg = await getFirebaseMessaging();
      const supported = msg !== null;

      if (!isMounted) return;

      setState((prev) => ({
        ...prev,
        isSupported: supported,
        permission: supported ? Notification.permission : "unsupported",
      }));

      if (supported && process.env.NODE_ENV !== "development") {
        void ensureMessagingServiceWorker().catch(() => {
          // Non-fatal: token request path will surface detailed errors.
        });
      }
    }

    void checkSupport();

    return () => {
      isMounted = false;
    };
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: "FCM is not supported in this environment.",
      }));
      return "unsupported" as const;
    }

    setState((prev) => ({ ...prev, error: null, isLoading: true }));
    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({
        ...prev,
        permission,
        isLoading: false,
      }));
      return permission;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to request notification permission.";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return state.permission;
    }
  }, [state.isSupported, state.permission]);

  const getFcmToken = useCallback(async () => {
    const msg = await getFirebaseMessaging();
    if (!state.isSupported || msg === null) {
      setState((prev) => ({
        ...prev,
        error: "FCM is not supported in this environment.",
      }));
      return null;
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      setState((prev) => ({
        ...prev,
        error: "Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY.",
      }));
      return null;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await ensureMessagingServiceWorker();
      const token = await getToken(msg, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      setState((prev) => ({
        ...prev,
        isLoading: false,
        token: token || null,
      }));

      return token || null;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get FCM token.";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return null;
    }
  }, [state.isSupported]);

  const requestPermissionAndGetToken = useCallback(async () => {
    const permission = await requestPermission();
    if (permission !== "granted") {
      return null;
    }
    return getFcmToken();
  }, [getFcmToken, requestPermission]);

  return {
    ...state,
    requestPermission,
    getFcmToken,
    requestPermissionAndGetToken,
  };
}
