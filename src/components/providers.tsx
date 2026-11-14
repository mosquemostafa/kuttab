"use client";

import { useEffect, type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registerSW = () => {
      if (process.env.NODE_ENV === "development") {
        void navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            Promise.all(registrations.map((r) => r.unregister())),
          )
          .catch(() => {
            // Best-effort: clear stale workers from prior `next start` / prod on localhost.
          });
      } else {
        void navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .catch((error) => {
            console.warn("[SW] Registration failed:", error);
          });
      }
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW, { once: true });
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    const initNotifications = () => {
      Promise.all([
        import("@/lib/firebase-client"),
        import("firebase/messaging"),
        import("react-hot-toast"),
      ])
        .then(
          ([{ getFirebaseMessaging }, { onMessage }, { default: toast }]) => {
            if (!isMounted) return;

            void getFirebaseMessaging().then((msg) => {
              if (!msg || !isMounted) return;

              unsubscribe = onMessage(msg, (payload) => {
                const title =
                  payload.notification?.title?.trim() || "New notification";
                const body = payload.notification?.body?.trim();
                toast.success(body ? `${title}: ${body}` : title);
              });
            });
          },
        )
        .catch(() => {});
    };

    if ("requestIdleCallback" in window) {
      const handle = (
        window as Window & {
          requestIdleCallback: (
            cb: () => void,
            opts?: { timeout: number },
          ) => number;
        }
      ).requestIdleCallback(initNotifications, { timeout: 3000 });

      return () => {
        isMounted = false;
        (
          window as Window & {
            cancelIdleCallback: (id: number) => void;
          }
        ).cancelIdleCallback(handle);
        unsubscribe?.();
      };
    }

    const timer = setTimeout(initNotifications, 2000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsubscribe?.();
    };
  }, []);

  return <TooltipProvider delayDuration={150}>{children}</TooltipProvider>;
}
