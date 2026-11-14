import type { FcmTokenRecord } from "@/shared/types/fcm.types";
import { request, requestNoStore } from "@/lib/api/api-core";

export const adminFcmApi = {
  sendToUser: (payload: {
    userId: string;
    title: string;
    body: string;
    url?: string;
    imageUrl?: string;
    data?: Record<string, string>;
  }) =>
    request<{
      targetedTokens: number;
      successCount: number;
      failureCount: number;
      failures: Array<{ token: string; code: string; message: string }>;
    }>("/admin/fcm/send-user", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendToToken: (payload: {
    token: string;
    title: string;
    body: string;
    url?: string;
    imageUrl?: string;
    data?: Record<string, string>;
  }) =>
    request<{ messageId: string }>("/admin/fcm/send-token", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendToRole: (payload: {
    role: string;
    title: string;
    body: string;
    url?: string;
    imageUrl?: string;
    data?: Record<string, string>;
  }) =>
    request<{ messageId: string; topic: string }>("/admin/fcm/send-role", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendToSegment: (payload: {
    segmentId: string;
    title: string;
    body: string;
    url?: string;
    imageUrl?: string;
    data?: Record<string, string>;
  }) =>
    request<{ messageId: string; topic: string }>("/admin/fcm/send-segment", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendToAllUsers: (payload: {
    title: string;
    body: string;
    url?: string;
    imageUrl?: string;
    data?: Record<string, string>;
  }) =>
    request<{ messageId: string; topic: string }>("/admin/fcm/send-all", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendToCustomTopic: (payload: {
    topic: string;
    title: string;
    body: string;
    url?: string;
    imageUrl?: string;
    data?: Record<string, string>;
  }) =>
    request<{ messageId: string; topic: string }>("/admin/fcm/send-custom", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const fcmApi = {
  listTokens: () => requestNoStore<FcmTokenRecord[]>("/fcm/tokens"),
  expectedTopics: () =>
    requestNoStore<{ topics: string[] }>("/fcm/expected-topics"),
  customTopics: () =>
    requestNoStore<{ availableTopics: string[]; subscribedTopics: string[] }>(
      "/fcm/custom-topics",
    ),
  setCustomTopicSubscription: (body: { topic: string; subscribed: boolean }) =>
    request<{
      customTopics: string[];
      syncResult: { scannedTokens: number; updatedTokens: number };
    }>("/fcm/custom-topics", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  syncTopics: () =>
    request<{ scannedTokens: number; updatedTokens: number }>(
      "/fcm/sync-topics",
      {
        method: "POST",
      },
    ),
  sendTest: () =>
    request<{
      targetedTokens: number;
      successCount: number;
      failureCount: number;
      failures: Array<{ token: string; code: string; message: string }>;
    }>("/fcm/send-test", {
      method: "POST",
    }),
  register: (body: {
    token: string;
    device?: string;
    userAgent?: string;
    os?: string;
    source: "browser" | "pwa";
  }) =>
    request<{ status: "already_registered" | "registered" | "updated" }>(
      "/fcm/register",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),
  unregister: (token: string) =>
    request<{ unregistered: true }>("/fcm/unregister", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  unregisterAll: () =>
    request<{ unregisteredAll: true; deletedCount: number }>(
      "/fcm/unregister-all",
      {
        method: "POST",
      },
    ),
};
