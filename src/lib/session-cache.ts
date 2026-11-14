export function getSessionCache<T>(key: string): {
  hit: boolean;
  data: T | null;
} {
  if (typeof window === "undefined") {
    return { hit: false, data: null };
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw === null) {
      return { hit: false, data: null };
    }
    return { hit: true, data: JSON.parse(raw) as T };
  } catch {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
    return { hit: false, data: null };
  }
}

export function setSessionCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore QuotaExceededError or disabled storage
  }
}

export const SESSION_SWR_OPTIONS = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  shouldRetryOnError: false,
} as const;
