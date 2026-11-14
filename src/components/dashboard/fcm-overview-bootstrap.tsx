"use client";

import { useEffect } from "react";
import { getToken } from "firebase/messaging";

import { apiClient } from "@/lib/api/api-client";
import { ensureMessagingServiceWorker } from "@/lib/ensure-fcm-service-worker";
import { getFcmClientInfo } from "@/lib/fcm-client-info";
import { getFirebaseMessaging } from "@/lib/firebase-client";

const OVERVIEW_FCM_BOOTSTRAP_SESSION_KEY = "fcm-overview-bootstrap-ran";

/**
 * Lightweight FCM bootstrap for overview page:
 * - only prompts when permission is still "default"
 * - if granted, gets token and registers it server-side
 * - skips entirely when already granted/denied
 */
export default function FcmOverviewBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(OVERVIEW_FCM_BOOTSTRAP_SESSION_KEY) === "1") {
      return;
    }
    sessionStorage.setItem(OVERVIEW_FCM_BOOTSTRAP_SESSION_KEY, "1");

    const run = async () => {
      if (
        typeof Notification === "undefined" ||
        !("serviceWorker" in navigator)
      ) {
        return;
      }

      // Per product requirement: do nothing unless this is first-time permission.
      if (Notification.permission !== "default") return;

      const msg = await getFirebaseMessaging();
      if (!msg) return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) return;

      const registration = await ensureMessagingServiceWorker();
      const token = await getToken(msg, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });
      if (!token) return;

      const info = getFcmClientInfo();
      await apiClient.fcm.register({
        token,
        device: info.device,
        os: info.os,
        userAgent: info.userAgent,
        source: info.source,
      });
    };

    void run().catch(() => {
      // Intentionally silent: this bootstrap should never interrupt page UX.
    });
  }, []);

  return null;
}
