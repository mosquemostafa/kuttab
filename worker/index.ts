const sw = self as unknown as ServiceWorkerGlobalScope;

const firebaseWebConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function hasRequiredFirebaseConfig(
  config: typeof firebaseWebConfig,
): config is {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string | undefined;
} {
  return Boolean(
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.storageBucket &&
    config.messagingSenderId &&
    config.appId,
  );
}

function buildFirebaseSwConfig(): Record<string, string> | null {
  if (!hasRequiredFirebaseConfig(firebaseWebConfig)) {
    return null;
  }

  const config: Record<string, string> = {
    apiKey: firebaseWebConfig.apiKey,
    authDomain: firebaseWebConfig.authDomain,
    projectId: firebaseWebConfig.projectId,
    storageBucket: firebaseWebConfig.storageBucket,
    messagingSenderId: firebaseWebConfig.messagingSenderId,
    appId: firebaseWebConfig.appId,
  };

  if (firebaseWebConfig.measurementId) {
    config.measurementId = firebaseWebConfig.measurementId;
  }

  return config;
}

// FCM runs inside the single app service worker (`/sw.js`) to avoid
// multi-worker scope conflicts at `/`.
try {
  importScripts(
    "https://www.gstatic.com/firebasejs/12.12.0/firebase-app-compat.js",
  );
  importScripts(
    "https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging-compat.js",
  );

  const firebaseGlobal = (
    sw as ServiceWorkerGlobalScope & {
      firebase?: {
        apps?: unknown[];
        initializeApp: (config: Record<string, string>) => void;
        messaging: () => {
          onBackgroundMessage: (
            callback: (payload: {
              notification?: { title?: string; body?: string };
              data?: { url?: string };
            }) => void,
          ) => void;
        };
      };
    }
  ).firebase;

  if (firebaseGlobal) {
    const resolvedConfig = buildFirebaseSwConfig();
    if (!resolvedConfig) {
      throw new Error(
        "Missing required Firebase web config for service worker",
      );
    }

    if (!firebaseGlobal.apps || firebaseGlobal.apps.length === 0) {
      firebaseGlobal.initializeApp(resolvedConfig);
    }

    const messaging = firebaseGlobal.messaging();
    messaging.onBackgroundMessage((payload) => {
      const notification = payload.notification || {};
      // When the payload already includes `notification`, FCM/browser displays
      // it automatically in background. Calling showNotification again would
      // create a duplicate notification.
      if (notification.title || notification.body) {
        return;
      }

      const title = "Almostafa";
      const body = "";
      const clickUrl = payload?.data?.url || "/dashboard/overview";

      void sw.registration.showNotification(title, {
        body,
        icon: "/pwa/icon-192x192.png",
        badge: "/pwa/icon-192x192-maskable.png",
        data: { url: clickUrl },
      });
    });

    sw.addEventListener("notificationclick", (event) => {
      event.notification.close();

      const targetUrl =
        typeof event.notification?.data?.url === "string"
          ? event.notification.data.url
          : "/dashboard/overview";

      event.waitUntil(
        sw.clients
          .matchAll({ type: "window", includeUncontrolled: true })
          .then((clients) => {
            for (const client of clients) {
              if (client.url === targetUrl && "focus" in client) {
                return client.focus();
              }
            }
            return sw.clients.openWindow(targetUrl);
          }),
      );
    });
  }
} catch {
  // If Firebase scripts fail to load, ignore gracefully.
}
