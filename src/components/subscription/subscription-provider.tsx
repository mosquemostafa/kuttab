"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import useSWR from "swr";

import { apiClient } from "@/lib/api/api-client";
import {
  getSessionCache,
  setSessionCache,
  SESSION_SWR_OPTIONS,
} from "@/lib/session-cache";
import type { SubscriptionDTO } from "@/shared/types/subscription.types";

const SESSION_SUBSCRIPTION_KEY = "session_subscription_current";

type SubscriptionContextValue = {
  subscription: SubscriptionDTO | null;
  isSubscriptionLoading: boolean;
  mutateSubscription: () => Promise<SubscriptionDTO | null>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null,
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const {
    data: subscription = null,
    isLoading: isSubscriptionLoading,
    mutate,
  } = useSWR<SubscriptionDTO | null>(
    "subscription-current",
    async () => {
      const cached = getSessionCache<SubscriptionDTO | null>(
        SESSION_SUBSCRIPTION_KEY,
      );
      if (cached.hit) {
        return cached.data;
      }
      const current = await apiClient.subscription.getCurrent();
      setSessionCache(SESSION_SUBSCRIPTION_KEY, current);
      return current;
    },
    SESSION_SWR_OPTIONS,
  );

  const mutateSubscription = useCallback(async () => {
    try {
      const current = await apiClient.subscription.getCurrent();
      setSessionCache(SESSION_SUBSCRIPTION_KEY, current);
      await mutate(current, false);
      return current;
    } catch {
      return subscription;
    }
  }, [mutate, subscription]);

  const value = useMemo(
    () => ({
      subscription: subscription ?? null,
      isSubscriptionLoading,
      mutateSubscription,
    }),
    [subscription, isSubscriptionLoading, mutateSubscription],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

const fallback: SubscriptionContextValue = {
  subscription: null,
  isSubscriptionLoading: true,
  mutateSubscription: async () => null,
};

export function useSubscription(): SubscriptionContextValue {
  return useContext(SubscriptionContext) ?? fallback;
}
