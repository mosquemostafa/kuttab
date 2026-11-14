import { deleteToken, getToken } from "firebase/messaging";

import { apiClient } from "@/lib/api/api-client";
import { ensureMessagingServiceWorker } from "@/lib/ensure-fcm-service-worker";
import { getFirebaseMessaging } from "@/lib/firebase-client";

/**
 * Best-effort: remove this browser's FCM token from the backend and from FCM.
 * Must run while the session is still valid (before sign-out). Never throws;
 * failures are ignored so sign-out cannot be blocked.
 */
export async function unregisterFcmCurrentDeviceBeforeSignOut(): Promise<void> {
  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (
      typeof window === "undefined" ||
      !vapidKey ||
      typeof Notification === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const msg = await getFirebaseMessaging();
    if (!msg) return;

    const registration = await ensureMessagingServiceWorker();
    const token = await getToken(msg, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      try {
        await apiClient.fcm.unregister(token);
      } catch {
        // Ignore: network, 401, etc. — logout must still proceed.
      }
    }

    try {
      await deleteToken(msg);
    } catch {
      // Ignore: no token, or SDK/network error.
    }
  } catch {
    // Ignore: getToken / SW not ready, unsupported environment, etc.
  }
}
