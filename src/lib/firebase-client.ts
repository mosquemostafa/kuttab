import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function hasRequiredFirebaseConfig(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId,
  );
}

function getOrInitApp() {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

let app: ReturnType<typeof getOrInitApp> | null = null;
try {
  if (hasRequiredFirebaseConfig()) {
    app = getOrInitApp();
  }
} catch {
  // Gracefully handle invalid config during build / SSR
}

let messagingInstance: Messaging | null = null;
let messagingPromise: Promise<Messaging | null> | null = null;

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined" || !app) {
    return null;
  }
  if (messagingInstance) {
    return messagingInstance;
  }
  if (!messagingPromise) {
    messagingPromise = isSupported()
      .then((supported) => {
        if (supported && app) {
          messagingInstance = getMessaging(app);
          messaging = messagingInstance;
          return messagingInstance;
        }
        return null;
      })
      .catch(() => null);
  }
  return messagingPromise;
}

let messaging: Messaging | null = null;

if (typeof window !== "undefined") {
  void getFirebaseMessaging().catch(() => {});
}

export { messaging };
export default app;
