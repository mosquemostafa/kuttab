import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { NotFoundException } from "@/server/exceptions/exceptions";
import { fcmService } from "@/server/modules/fcm/fcm.service";
import {
  registerFcmTokenSchema,
  sendFcmToCustomTopicSchema,
  sendFcmToAllUsersTopicSchema,
  sendFcmToRoleTopicSchema,
  sendFcmToSegmentTopicSchema,
  sendFcmToTokenSchema,
  sendFcmToUserSchema,
  updateCustomTopicSubscriptionSchema,
  unregisterFcmTokenSchema,
} from "@/server/modules/fcm/fcm.dto";
import { userRepository } from "@/server/modules/users/user.repository";
import { validateBody } from "@/server/pipes/validate.pipe";
import { getUserId } from "@/server/utils/request-user";
import type { ApiSuccess } from "@/shared/types/api-response.types";
import type { PaginationMeta } from "@/shared/types/pagination.types";

function ok<T>(
  data: T,
  meta?: PaginationMeta,
  status = 200,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export const fcmController = {
  async list(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const tokens = await fcmService.listTokens(userId);
    return ok(tokens);
  },

  async register(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const body = await req.json();
    const input = validateBody(registerFcmTokenSchema, body);

    const status = await fcmService.register({
      userId,
      input,
      requestUserAgent: req.headers.get("user-agent"),
    });

    return ok({ status });
  },

  async unregister(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const body = await req.json();
    const input = validateBody(unregisterFcmTokenSchema, body);

    await fcmService.unregisterToken({ userId, input });
    return ok({ unregistered: true as const });
  },

  async unregisterAll(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const deletedCount = await fcmService.unregisterAllTokens(userId);
    return ok({ unregisteredAll: true as const, deletedCount });
  },

  async expectedTopics(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const topics = await fcmService.getExpectedTopicsForUser(userId);
    return ok({ topics });
  },

  async syncTopics(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const result = await fcmService.resyncUserTokenTopics(userId);
    return ok(result);
  },

  async listCustomTopics(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const [availableTopics, subscribedTopics] = await Promise.all([
      fcmService.listAvailableCustomTopics(),
      fcmService.listUserCustomTopics(userId),
    ]);
    return ok({ availableTopics, subscribedTopics });
  },

  async updateCustomTopicSubscription(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const body = await req.json();
    const input = validateBody(updateCustomTopicSubscriptionSchema, body);
    const result = await fcmService.setUserCustomTopicSubscription({
      userId,
      topic: input.topic,
      subscribed: input.subscribed,
    });
    return ok(result);
  },

  async sendTestToSelf(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const result = await fcmService.sendToUser({
      userId,
      payload: {
        title: "Test notification",
        body: "If you can see this, your push notifications are working.",
        url: "/dashboard/settings",
      },
    });
    return ok(result);
  },

  async sendToUser(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(sendFcmToUserSchema, body);
    const { userId, ...payload } = input;

    const userExists = await userRepository.existsById(userId);
    if (!userExists) {
      throw new NotFoundException("User", userId);
    }

    const result = await fcmService.sendToUser({ userId, payload });
    return ok(result);
  },

  async sendToToken(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(sendFcmToTokenSchema, body);
    const result = await fcmService.sendToToken(input);
    return ok(result);
  },

  async sendToRoleTopic(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(sendFcmToRoleTopicSchema, body);
    const [topic] = fcmService.getTopicsForAdminTarget({ role: input.role });
    const { role: _role, ...payload } = input;
    const result = await fcmService.sendToTopic({ topic, payload });
    return ok({ ...result, topic });
  },

  async sendToSegmentTopic(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(sendFcmToSegmentTopicSchema, body);
    const [topic] = fcmService.getTopicsForAdminTarget({
      segmentId: input.segmentId,
    });
    const { segmentId: _segmentId, ...payload } = input;
    const result = await fcmService.sendToTopic({ topic, payload });
    return ok({ ...result, topic });
  },

  async sendToAllUsersTopic(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(sendFcmToAllUsersTopicSchema, body);
    const [topic] = fcmService.getTopicsForAdminTarget({
      includeAllUsers: true,
    });
    const result = await fcmService.sendToTopic({ topic, payload: input });
    return ok({ ...result, topic });
  },

  async sendToCustomTopic(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(sendFcmToCustomTopicSchema, body);
    const [topic] = fcmService.getTopicsForAdminTarget({
      customTopic: input.topic,
    });
    const { topic: _topic, ...payload } = input;
    const result = await fcmService.sendToTopic({ topic, payload });
    return ok({ ...result, topic });
  },
};
