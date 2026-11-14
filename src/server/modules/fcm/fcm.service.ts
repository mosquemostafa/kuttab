import {
  DocumentData,
  DocumentSnapshot,
  Timestamp,
} from "firebase-admin/firestore";
import {
  MessagingClientErrorCode,
  SendResponse,
} from "firebase-admin/messaging";

import { env } from "@/server/lib/env";
import {
  getFirebaseAdminMessaging,
  getFirestoreDb,
} from "@/server/lib/firebase-admin";
import { ValidationException } from "@/server/exceptions/exceptions";
import { userRepository } from "@/server/modules/users/user.repository";
import type {
  RegisterFcmTokenDTO,
  SendFcmToTokenDTO,
  SendFcmToUserDTO,
  UnregisterFcmTokenDTO,
} from "@/server/modules/fcm/fcm.dto";
import { normalizeUserRole } from "@/shared/enums/user-role.enum";
import type { FcmSource, FcmTokenRecord } from "@/shared/types/fcm.types";

const APP_ORIGIN = (env.NEXT_PUBLIC_APP_URL || "https://example.com").replace(
  /\/$/,
  "",
);
const FCM_NOTIFICATION_ICON = `${APP_ORIGIN}/pwa/icon-192x192.png`;
const FCM_NOTIFICATION_BADGE = `${APP_ORIGIN}/pwa/icon-192x192-maskable.png`;
const ALL_USERS_TOPIC = "all_users";
const AVAILABLE_CUSTOM_TOPICS = ["product_updates"] as const;
const AVAILABLE_CUSTOM_TOPICS_SET = new Set<string>(AVAILABLE_CUSTOM_TOPICS);

function tokenDocRef(userId: string, token: string) {
  return getFirestoreDb()
    .collection("fcm_tokens")
    .doc(userId)
    .collection("tokens")
    .doc(token);
}

function userFcmPreferencesDocRef(userId: string) {
  return getFirestoreDb()
    .collection("fcm_tokens")
    .doc(userId)
    .collection("meta")
    .doc("preferences");
}

/**
 * Multicast/send errors use the same string codes as {@link FirebaseMessagingError}
 * (`messaging/<MessagingClientErrorCode.*.code>`). Prefer SDK constants over literals.
 */
const PERMANENT_FCM_TOKEN_FAILURE_CODES = new Set([
  `messaging/${MessagingClientErrorCode.REGISTRATION_TOKEN_NOT_REGISTERED.code}`,
  `messaging/${MessagingClientErrorCode.INVALID_REGISTRATION_TOKEN.code}`,
]);

function isPermanentFcmTokenFailure(code: string): boolean {
  return PERMANENT_FCM_TOKEN_FAILURE_CODES.has(code);
}

function buildRoleTopic(role: string | null | undefined): string {
  return `role_${normalizeUserRole(role).toLowerCase()}`;
}

function buildSegmentTopic(
  segmentId: string | null | undefined,
): string | null {
  if (!segmentId) return null;
  const normalized = segmentId.trim();
  return normalized.length > 0 ? `segment_${normalized}` : null;
}

function uniqueTopics(topics: string[]): string[] {
  return [...new Set(topics.filter((topic) => topic.length > 0))];
}

function readTopics(data: Record<string, unknown> | undefined): string[] {
  if (!data) return [];
  const raw = data.topics;
  if (!Array.isArray(raw)) return [];
  return uniqueTopics(
    raw.filter((topic): topic is string => typeof topic === "string"),
  );
}

function hasSameTopics(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  for (const topic of b) {
    if (!setA.has(topic)) return false;
  }
  return true;
}

function validateCustomTopic(topic: string): string {
  const normalized = topic.trim();
  if (!AVAILABLE_CUSTOM_TOPICS_SET.has(normalized)) {
    throw new ValidationException({
      fieldErrors: {
        topic: [
          `Unsupported custom topic '${normalized}'. Allowed: ${AVAILABLE_CUSTOM_TOPICS.join(", ")}`,
        ],
      },
    });
  }
  return normalized;
}

async function subscribeTokenToTopics(
  token: string,
  topics: string[],
): Promise<{
  successful: string[];
  failed: Array<{ topic: string; reason: string }>;
}> {
  const successful: string[] = [];
  const failed: Array<{ topic: string; reason: string }> = [];

  for (const topic of topics) {
    try {
      const result = await getFirebaseAdminMessaging().subscribeToTopic(
        token,
        topic,
      );
      if (result.successCount > 0) {
        successful.push(topic);
      } else {
        failed.push({
          topic,
          reason:
            result.errors[0]?.error?.message ?? "Unknown subscribe failure",
        });
      }
    } catch (error) {
      failed.push({
        topic,
        reason:
          error instanceof Error ? error.message : "Unknown subscribe error",
      });
    }
  }

  return { successful, failed };
}

async function unsubscribeTokenFromTopics(
  token: string,
  topics: string[],
): Promise<{
  successful: string[];
  failed: Array<{ topic: string; reason: string }>;
}> {
  const successful: string[] = [];
  const failed: Array<{ topic: string; reason: string }> = [];

  for (const topic of topics) {
    try {
      const result = await getFirebaseAdminMessaging().unsubscribeFromTopic(
        token,
        topic,
      );
      if (result.successCount > 0) {
        successful.push(topic);
      } else {
        failed.push({
          topic,
          reason:
            result.errors[0]?.error?.message ?? "Unknown unsubscribe failure",
        });
      }
    } catch (error) {
      failed.push({
        topic,
        reason:
          error instanceof Error ? error.message : "Unknown unsubscribe error",
      });
    }
  }

  return { successful, failed };
}

async function syncTokenTopics(params: {
  token: string;
  desiredTopics: string[];
  currentTopics: string[];
}): Promise<{
  topics: string[];
  subscribeFailed: Array<{ topic: string; reason: string }>;
  unsubscribeFailed: Array<{ topic: string; reason: string }>;
}> {
  const desired = uniqueTopics(params.desiredTopics);
  const current = uniqueTopics(params.currentTopics);
  const desiredSet = new Set(desired);
  const currentSet = new Set(current);
  const toSubscribe = desired.filter((topic) => !currentSet.has(topic));
  const toUnsubscribe = current.filter((topic) => !desiredSet.has(topic));

  const subscribeResult = await subscribeTokenToTopics(
    params.token,
    toSubscribe,
  );
  const unsubscribeResult = await unsubscribeTokenFromTopics(
    params.token,
    toUnsubscribe,
  );

  const nextTopics = new Set(current);
  for (const topic of subscribeResult.successful) {
    nextTopics.add(topic);
  }
  for (const topic of unsubscribeResult.successful) {
    nextTopics.delete(topic);
  }

  return {
    topics: [...nextTopics],
    subscribeFailed: subscribeResult.failed,
    unsubscribeFailed: unsubscribeResult.failed,
  };
}

async function buildDesiredTopicsForUser(userId: string): Promise<string[]> {
  const user = await userRepository.findRoleAndSegmentById(userId);
  if (!user) {
    return [ALL_USERS_TOPIC, buildRoleTopic(null)];
  }

  const topics = [ALL_USERS_TOPIC, buildRoleTopic(user.role)];
  const segmentTopic = buildSegmentTopic(user.segmentId);
  if (segmentTopic) {
    topics.push(segmentTopic);
  }

  const customTopics = await fcmService.listUserCustomTopics(userId);
  return uniqueTopics([...topics, ...customTopics]);
}

async function batchDeleteUserTokens(
  userId: string,
  tokens: string[],
): Promise<void> {
  const unique = [
    ...new Set(tokens.filter((t) => t.length > 0 && t !== "unknown-token")),
  ];
  if (unique.length === 0) return;

  const batchLimit = 500;
  for (let i = 0; i < unique.length; i += batchLimit) {
    const slice = unique.slice(i, i + batchLimit);
    const refs = slice.map((token) => tokenDocRef(userId, token));
    const snapshots = await getFirestoreDb().getAll(...refs);

    for (const doc of snapshots) {
      const data = doc.data() as Record<string, unknown> | undefined;
      const token = (data?.token as string | undefined) ?? doc.id;
      const topics = readTopics(data);
      if (topics.length > 0) {
        await unsubscribeTokenFromTopics(token, topics);
      }
    }

    const batch = getFirestoreDb().batch();
    for (const token of slice) {
      batch.delete(tokenDocRef(userId, token));
    }
    await batch.commit();
  }
}

export const fcmService = {
  listAvailableCustomTopics(): string[] {
    return [...AVAILABLE_CUSTOM_TOPICS];
  },

  async listUserCustomTopics(userId: string): Promise<string[]> {
    const snapshot = await userFcmPreferencesDocRef(userId).get();
    if (!snapshot.exists) return [];
    const data = snapshot.data() as Record<string, unknown> | undefined;
    const raw = data?.customTopics;
    if (!Array.isArray(raw)) return [];
    return uniqueTopics(
      raw.filter(
        (topic): topic is string =>
          typeof topic === "string" && AVAILABLE_CUSTOM_TOPICS_SET.has(topic),
      ),
    );
  },

  async setUserCustomTopicSubscription(params: {
    userId: string;
    topic: string;
    subscribed: boolean;
  }): Promise<{
    customTopics: string[];
    syncResult: { scannedTokens: number; updatedTokens: number };
  }> {
    const normalizedTopic = validateCustomTopic(params.topic);
    const existing = await this.listUserCustomTopics(params.userId);
    const next = params.subscribed
      ? uniqueTopics([...existing, normalizedTopic])
      : existing.filter((topic) => topic !== normalizedTopic);

    await userFcmPreferencesDocRef(params.userId).set(
      {
        customTopics: next,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );

    const syncResult = await this.resyncUserTokenTopics(params.userId);
    return { customTopics: next, syncResult };
  },

  async sendToToken(
    payload: SendFcmToTokenDTO,
  ): Promise<{ messageId: string }> {
    const messageId = await getFirebaseAdminMessaging().send({
      token: payload.token,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: {
        ...(payload.data ?? {}),
        url: payload.url ?? "/dashboard/overview",
      },
      webpush: {
        notification: {
          icon: FCM_NOTIFICATION_ICON,
          badge: FCM_NOTIFICATION_BADGE,
          requireInteraction: false,
        },
        fcmOptions: {
          link: payload.url ?? "/dashboard/overview",
        },
      },
    });

    return { messageId };
  },

  async sendToUser(params: {
    userId: string;
    payload: Omit<SendFcmToUserDTO, "userId">;
  }): Promise<{
    targetedTokens: number;
    successCount: number;
    failureCount: number;
    failures: Array<{
      token: string;
      code: string;
      message: string;
    }>;
  }> {
    const { userId, payload } = params;

    const snapshot = await getFirestoreDb()
      .collection("fcm_tokens")
      .doc(userId)
      .collection("tokens")
      .where("isActive", "==", true)
      .get();

    const tokens = snapshot.docs
      .map(
        (doc: DocumentSnapshot<DocumentData>) =>
          (doc.data()?.token as string | undefined) ?? doc.id,
      )
      .filter((token: string) => token.length > 0);

    if (tokens.length === 0) {
      return {
        targetedTokens: 0,
        successCount: 0,
        failureCount: 0,
        failures: [],
      };
    }

    let successCount = 0;
    let failureCount = 0;
    const failures: Array<{ token: string; code: string; message: string }> =
      [];
    const chunkSize = 500;

    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);
      const result = await getFirebaseAdminMessaging().sendEachForMulticast({
        tokens: chunk,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: {
          ...(payload.data ?? {}),
          url: payload.url ?? "/dashboard/overview",
        },
        webpush: {
          notification: {
            icon: FCM_NOTIFICATION_ICON,
            badge: FCM_NOTIFICATION_BADGE,
            requireInteraction: false,
          },
          fcmOptions: {
            link: payload.url ?? "/dashboard/overview",
          },
        },
      });

      successCount += result.successCount;
      failureCount += result.failureCount;

      const tokensToDelete: string[] = [];

      result.responses.forEach((response: SendResponse, idx: number) => {
        if (response.success) return;
        const error = response.error;
        const code = error?.code ?? "messaging/unknown-error";
        const token = chunk[idx] ?? "unknown-token";
        failures.push({
          token,
          code,
          message: error?.message ?? "Unknown FCM send error",
        });
        if (isPermanentFcmTokenFailure(code)) {
          tokensToDelete.push(token);
        }
      });

      if (tokensToDelete.length > 0) {
        await batchDeleteUserTokens(userId, tokensToDelete);
      }
    }

    return {
      targetedTokens: tokens.length,
      successCount,
      failureCount,
      failures,
    };
  },

  /** Upserts token only when needed; skips FCM topic calls when doc already matches desired state. */
  async register(params: {
    userId: string;
    input: RegisterFcmTokenDTO;
    requestUserAgent: string | null;
  }): Promise<"already_registered" | "registered" | "updated"> {
    const { userId, input, requestUserAgent } = params;
    const docRef = tokenDocRef(userId, input.token);
    const resolvedUserAgent = input.userAgent ?? requestUserAgent ?? "unknown";
    const resolvedOs = input.os ?? "unknown";
    const resolvedDevice = input.device;

    const existing = await docRef.get();
    const now = Timestamp.now();
    const existingCreatedAt = existing.exists
      ? ((existing.get("createdAt") as Timestamp | undefined) ?? now)
      : now;
    const currentTopics = readTopics(
      existing.data() as Record<string, unknown> | undefined,
    );
    const desiredTopics = await buildDesiredTopicsForUser(userId);

    if (
      existing.exists &&
      existing.get("device") === resolvedDevice &&
      existing.get("userAgent") === resolvedUserAgent &&
      existing.get("os") === resolvedOs &&
      existing.get("source") === input.source &&
      existing.get("isActive") === true &&
      hasSameTopics(currentTopics, desiredTopics)
    ) {
      return "already_registered";
    }

    const syncedTopics = await syncTokenTopics({
      token: input.token,
      desiredTopics,
      currentTopics,
    });

    const shouldWrite =
      !existing.exists ||
      existing.get("device") !== resolvedDevice ||
      existing.get("userAgent") !== resolvedUserAgent ||
      existing.get("os") !== resolvedOs ||
      existing.get("source") !== input.source ||
      existing.get("isActive") !== true ||
      !hasSameTopics(currentTopics, syncedTopics.topics);

    if (!shouldWrite) {
      return "already_registered";
    }

    await docRef.set(
      {
        token: input.token,
        device: resolvedDevice,
        userAgent: resolvedUserAgent,
        os: resolvedOs,
        source: input.source,
        topics: syncedTopics.topics,
        topicsUpdatedAt: now,
        isActive: true,
        createdAt: existingCreatedAt,
        updatedAt: now,
      },
      { merge: true },
    );

    return existing.exists ? "updated" : "registered";
  },

  async resyncUserTokenTopics(userId: string): Promise<{
    scannedTokens: number;
    updatedTokens: number;
  }> {
    const desiredTopics = await buildDesiredTopicsForUser(userId);
    const snapshot = await getFirestoreDb()
      .collection("fcm_tokens")
      .doc(userId)
      .collection("tokens")
      .get();

    let updatedTokens = 0;
    const now = Timestamp.now();

    for (const doc of snapshot.docs) {
      const data = doc.data() as Record<string, unknown>;
      const token = (data.token as string | undefined) ?? doc.id;
      const currentTopics = readTopics(data);
      const syncedTopics = await syncTokenTopics({
        token,
        desiredTopics,
        currentTopics,
      });

      if (!hasSameTopics(currentTopics, syncedTopics.topics)) {
        await doc.ref.set(
          {
            topics: syncedTopics.topics,
            topicsUpdatedAt: now,
            updatedAt: now,
          },
          { merge: true },
        );
        updatedTokens += 1;
      }
    }

    return {
      scannedTokens: snapshot.size,
      updatedTokens,
    };
  },

  async getExpectedTopicsForUser(userId: string): Promise<string[]> {
    return buildDesiredTopicsForUser(userId);
  },

  async unregisterToken(params: {
    userId: string;
    input: UnregisterFcmTokenDTO;
  }): Promise<void> {
    const { userId, input } = params;
    const ref = tokenDocRef(userId, input.token);
    const snapshot = await ref.get();
    const data = snapshot.data() as Record<string, unknown> | undefined;
    const topics = readTopics(data);
    if (topics.length > 0) {
      await unsubscribeTokenFromTopics(input.token, topics);
    }
    await ref.delete();
  },

  async unregisterAllTokens(userId: string): Promise<number> {
    const collectionRef = getFirestoreDb()
      .collection("fcm_tokens")
      .doc(userId)
      .collection("tokens");

    let deletedCount = 0;

    while (true) {
      const snapshot = await collectionRef.limit(500).get();
      if (snapshot.empty) {
        break;
      }

      const batch = getFirestoreDb().batch();
      for (const doc of snapshot.docs) {
        const data = doc.data() as Record<string, unknown>;
        const token = (data.token as string | undefined) ?? doc.id;
        const topics = readTopics(data);
        if (topics.length > 0) {
          await unsubscribeTokenFromTopics(token, topics);
        }
        batch.delete(doc.ref);
      }
      await batch.commit();
      deletedCount += snapshot.size;
    }

    return deletedCount;
  },

  async listTokens(userId: string): Promise<FcmTokenRecord[]> {
    const snapshot = await getFirestoreDb()
      .collection("fcm_tokens")
      .doc(userId)
      .collection("tokens")
      .orderBy("updatedAt", "desc")
      .get();

    return snapshot.docs.map((doc: DocumentSnapshot<DocumentData>) => {
      const data = doc.data() as {
        token?: string;
        device?: string;
        userAgent?: string;
        os?: string;
        source?: FcmSource;
        topics?: string[];
        isActive?: boolean;
        createdAt?: Timestamp;
        updatedAt?: Timestamp;
      };

      return {
        token: data.token ?? doc.id,
        device: data.device ?? "web",
        userAgent: data.userAgent ?? "unknown",
        os: data.os ?? "unknown",
        source: data.source ?? "browser",
        topics: uniqueTopics(data.topics ?? []),
        isActive: data.isActive ?? true,
        createdAt: (data.createdAt ?? Timestamp.now()).toDate().toISOString(),
        updatedAt: (data.updatedAt ?? Timestamp.now()).toDate().toISOString(),
      };
    });
  },

  async sendToTopic(params: {
    topic: string;
    payload: Omit<SendFcmToUserDTO, "userId">;
  }): Promise<{ messageId: string }> {
    const { topic, payload } = params;
    const messageId = await getFirebaseAdminMessaging().send({
      topic,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: {
        ...(payload.data ?? {}),
        url: payload.url ?? "/dashboard/overview",
      },
      webpush: {
        notification: {
          icon: FCM_NOTIFICATION_ICON,
          badge: FCM_NOTIFICATION_BADGE,
          requireInteraction: false,
        },
        fcmOptions: {
          link: payload.url ?? "/dashboard/overview",
        },
      },
    });

    return { messageId };
  },

  getTopicsForAdminTarget(params: {
    role?: string;
    segmentId?: string;
    includeAllUsers?: boolean;
    customTopic?: string;
  }): string[] {
    const topics: string[] = [];
    if (params.includeAllUsers) {
      topics.push(ALL_USERS_TOPIC);
    }
    if (params.role) {
      topics.push(buildRoleTopic(params.role));
    }
    if (params.segmentId) {
      const segmentTopic = buildSegmentTopic(params.segmentId);
      if (segmentTopic) topics.push(segmentTopic);
    }
    if (params.customTopic) {
      topics.push(validateCustomTopic(params.customTopic));
    }
    return uniqueTopics(topics);
  },
};
