/**
 * Ensures the app service worker at `/` is registered and ready for FCM token operations.
 */
export async function ensureMessagingServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (process.env.NODE_ENV === "development") {
    throw new Error("Service worker is disabled in development.");
  }

  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    throw new Error("Service worker is not supported in this environment.");
  }

  let registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) {
    registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
  }

  if (registration.active) {
    return registration;
  }

  // If the worker is still installing or activating, wait for ready with a timeout fallback
  const TIMEOUT_MS = 10000;
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          "Timeout waiting for service worker to activate. Please refresh.",
        ),
      );
    }, TIMEOUT_MS);
  });

  return Promise.race([navigator.serviceWorker.ready, timeoutPromise]);
}
