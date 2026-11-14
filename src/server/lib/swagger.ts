import swaggerJsdoc from "swagger-jsdoc";
import staticSpec from "./swagger-spec.json";

import { COLOR_KEYS } from "@/shared/constants/color-palette";

const SWAGGER_COLOR_KEY_ENUM = [...COLOR_KEYS];

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SaaS Starter API",
      version: "1.0.0",
      description: "API documentation for SaaS Starter",
      contact: {
        name: "SaaS Starter Team",
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        description: "API Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "session",
        },
        sessionAuth: {
          type: "apiKey",
          in: "cookie",
          name: "session",
        },
      },
      schemas: {
        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 10 },
            total: { type: "integer", example: 42 },
            totalPages: { type: "integer", example: 5 },
          },
        },
        Todo: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            title: { type: "string" },
            projectId: { type: "string", nullable: true },
            isCompleted: { type: "boolean" },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
              nullable: true,
            },
            dueDate: {
              type: "string",
              format: "date",
              nullable: true,
            },
            checklist: {
              type: "array",
              maxItems: 20,
              description: "Embedded steps with completion state",
              items: {
                type: "object",
                required: ["id", "title", "isCompleted"],
                properties: {
                  id: { type: "string", maxLength: 64 },
                  title: { type: "string", maxLength: 255 },
                  isCompleted: { type: "boolean" },
                },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "id",
            "userId",
            "title",
            "projectId",
            "tags",
            "checklist",
            "isCompleted",
            "createdAt",
            "updatedAt",
          ],
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            slug: {
              type: "string",
              description:
                "URL-safe identifier, unique per user (lowercase letters, numbers, hyphens).",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              maxLength: 128,
            },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            colorKey: {
              type: "string",
              enum: SWAGGER_COLOR_KEY_ENUM,
              nullable: true,
            },
            icon: { type: "string", nullable: true },
            isArchived: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "id",
            "userId",
            "slug",
            "name",
            "isArchived",
            "createdAt",
            "updatedAt",
          ],
        },
        Note: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            title: { type: "string" },
            content: { type: "string" },
            projectId: { type: "string", nullable: true },
            isArchived: { type: "boolean" },
            isPinned: { type: "boolean" },
            colorKey: {
              type: "string",
              enum: SWAGGER_COLOR_KEY_ENUM,
              nullable: true,
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Labels for filtering (exact match via list ?tag=)",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "id",
            "userId",
            "title",
            "content",
            "projectId",
            "tags",
            "isArchived",
            "isPinned",
            "colorKey",
            "createdAt",
            "updatedAt",
          ],
        },
        CalendarEvent: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            scheduledDate: { type: "string", format: "date" },
            scheduledStartDatetime: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            scheduledEndDatetime: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            notes: { type: "string", nullable: true },
            colorKey: {
              type: "string",
              enum: SWAGGER_COLOR_KEY_ENUM,
              nullable: true,
            },
            repetitionType: {
              type: "string",
              enum: ["daily", "weekly", "monthly"],
              nullable: true,
            },
            specificDays: {
              type: "array",
              items: { type: "integer" },
            },
            endDate: { type: "string", format: "date", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "id",
            "userId",
            "title",
            "description",
            "scheduledDate",
            "scheduledStartDatetime",
            "scheduledEndDatetime",
            "notes",
            "createdAt",
            "updatedAt",
          ],
        },
        UserWithDetails: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string", nullable: true },
            emailVerified: { type: "boolean" },
            role: { type: "string", enum: ["user", "admin"] },
            banned: { type: "boolean" },
            banReason: { type: "string", nullable: true },
            image: { type: "string", nullable: true },
            accounts: { type: "array", items: { type: "string" } },
            lastSignIn: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            avatarUrl: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "UNAUTHORIZED" },
                message: { type: "string" },
                details: { type: "object", nullable: true },
              },
            },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
            status: {
              type: "number",
              description: "HTTP status code",
            },
          },
          required: ["error"],
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "User ID",
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
            },
            phone: {
              type: "string",
              nullable: true,
              description: "User's phone number",
            },
            name: {
              type: "string",
              description: "User's full name",
            },
            role: {
              type: "string",
              enum: ["user", "admin"],
              description: "User's role",
            },
            status: {
              type: "string",
              enum: ["active", "inactive", "banned"],
              description: "User's account status",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation date",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update date",
            },
          },
          required: ["id", "email", "name", "role"],
        },
        PaginationParams: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              default: 1,
              description: "Page number",
            },
            limit: {
              type: "integer",
              default: 10,
              description: "Items per page",
            },
          },
        },
        NewsletterSubscribeRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
            locale: { type: "string", enum: ["ar", "en"] },
          },
        },
        NewsletterSubscribeResponse: {
          type: "object",
          properties: {
            subscriberId: { type: "string" },
            email: { type: "string", format: "email" },
          },
          required: ["subscriberId", "email"],
        },
        NewsletterUnsubscribeRequest: {
          type: "object",
          required: ["token"],
          properties: {
            token: {
              type: "string",
              description: "Opaque token from unsubscribe link",
            },
          },
        },
        FcmRegisterRequest: {
          type: "object",
          required: ["token", "source"],
          properties: {
            token: {
              type: "string",
              description: "FCM registration token from Firebase Messaging SDK",
            },
            device: {
              type: "string",
              example: "web",
              default: "web",
            },
            userAgent: {
              type: "string",
              description: "Browser user-agent string",
            },
            os: {
              type: "string",
              description: "Client operating system label",
            },
            source: {
              type: "string",
              enum: ["browser", "pwa"],
              description: "Token source context",
            },
          },
        },
        FcmRegisterResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["already_registered", "registered", "updated"],
                  description:
                    "Whether the server wrote the token doc and synced topics",
                },
              },
              required: ["status"],
            },
            timestamp: { type: "string", format: "date-time" },
          },
          required: ["success", "data", "timestamp"],
        },
        FcmUnregisterRequest: {
          type: "object",
          required: ["token"],
          properties: {
            token: {
              type: "string",
              description: "FCM token to remove for current authenticated user",
            },
          },
        },
        FcmUnregisterResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                unregistered: { type: "boolean", example: true },
              },
              required: ["unregistered"],
            },
            timestamp: { type: "string", format: "date-time" },
          },
          required: ["success", "data", "timestamp"],
        },
        FcmUnregisterAllResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                unregisteredAll: { type: "boolean", example: true },
                deletedCount: { type: "integer", example: 3 },
              },
              required: ["unregisteredAll", "deletedCount"],
            },
            timestamp: { type: "string", format: "date-time" },
          },
          required: ["success", "data", "timestamp"],
        },
        FcmSendUserRequest: {
          type: "object",
          required: ["userId", "title", "body"],
          properties: {
            userId: { type: "string" },
            title: { type: "string" },
            body: { type: "string" },
            url: {
              type: "string",
              description: "Click target URL; defaults to /dashboard/overview",
            },
            imageUrl: {
              type: "string",
              format: "uri",
              description:
                "Optional absolute image URL for rich notification preview",
            },
            data: {
              type: "object",
              additionalProperties: { type: "string" },
            },
          },
        },
        FcmSendTokenRequest: {
          type: "object",
          required: ["token", "title", "body"],
          properties: {
            token: { type: "string" },
            title: { type: "string" },
            body: { type: "string" },
            url: {
              type: "string",
              description: "Click target URL; defaults to /dashboard/overview",
            },
            imageUrl: {
              type: "string",
              format: "uri",
              description:
                "Optional absolute image URL for rich notification preview",
            },
            data: {
              type: "object",
              additionalProperties: { type: "string" },
            },
          },
        },
        FcmSendRoleTopicRequest: {
          type: "object",
          required: ["role", "title", "body"],
          properties: {
            role: { type: "string", example: "admin" },
            title: { type: "string" },
            body: { type: "string" },
            url: {
              type: "string",
              description: "Click target URL; defaults to /dashboard/overview",
            },
            imageUrl: {
              type: "string",
              format: "uri",
              description:
                "Optional absolute image URL for rich notification preview",
            },
            data: {
              type: "object",
              additionalProperties: { type: "string" },
            },
          },
        },
        FcmSendSegmentTopicRequest: {
          type: "object",
          required: ["segmentId", "title", "body"],
          properties: {
            segmentId: { type: "string" },
            title: { type: "string" },
            body: { type: "string" },
            url: {
              type: "string",
              description: "Click target URL; defaults to /dashboard/overview",
            },
            imageUrl: {
              type: "string",
              format: "uri",
              description:
                "Optional absolute image URL for rich notification preview",
            },
            data: {
              type: "object",
              additionalProperties: { type: "string" },
            },
          },
        },
        FcmSendAllUsersTopicRequest: {
          type: "object",
          required: ["title", "body"],
          properties: {
            title: { type: "string" },
            body: { type: "string" },
            url: {
              type: "string",
              description: "Click target URL; defaults to /dashboard/overview",
            },
            imageUrl: {
              type: "string",
              format: "uri",
              description:
                "Optional absolute image URL for rich notification preview",
            },
            data: {
              type: "object",
              additionalProperties: { type: "string" },
            },
          },
        },
        FcmSendCustomTopicRequest: {
          type: "object",
          required: ["topic", "title", "body"],
          properties: {
            topic: { type: "string", example: "product_updates" },
            title: { type: "string" },
            body: { type: "string" },
            url: {
              type: "string",
              description: "Click target URL; defaults to /dashboard/overview",
            },
            imageUrl: {
              type: "string",
              format: "uri",
              description:
                "Optional absolute image URL for rich notification preview",
            },
            data: {
              type: "object",
              additionalProperties: { type: "string" },
            },
          },
        },
        FcmSendUserResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                targetedTokens: { type: "integer", example: 3 },
                successCount: { type: "integer", example: 3 },
                failureCount: { type: "integer", example: 0 },
                failures: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      token: { type: "string" },
                      code: {
                        type: "string",
                        example: "messaging/invalid-argument",
                      },
                      message: { type: "string" },
                    },
                    required: ["token", "code", "message"],
                  },
                },
              },
              required: [
                "targetedTokens",
                "successCount",
                "failureCount",
                "failures",
              ],
            },
            timestamp: { type: "string", format: "date-time" },
          },
          required: ["success", "data", "timestamp"],
        },
        FcmSendTokenResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                messageId: { type: "string" },
              },
              required: ["messageId"],
            },
            timestamp: { type: "string", format: "date-time" },
          },
          required: ["success", "data", "timestamp"],
        },
        FcmSendTopicResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                messageId: { type: "string" },
                topic: { type: "string" },
              },
              required: ["messageId", "topic"],
            },
            timestamp: { type: "string", format: "date-time" },
          },
          required: ["success", "data", "timestamp"],
        },
        FcmTokenRecord: {
          type: "object",
          properties: {
            token: { type: "string" },
            device: { type: "string", example: "desktop" },
            userAgent: { type: "string" },
            os: { type: "string", example: "macOS" },
            source: {
              type: "string",
              enum: ["browser", "pwa"],
            },
            topics: {
              type: "array",
              items: { type: "string" },
              example: ["all_users", "role_user", "segment_default"],
            },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "token",
            "device",
            "userAgent",
            "os",
            "source",
            "topics",
            "isActive",
            "createdAt",
            "updatedAt",
          ],
        },
        FcmListTokensResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/FcmTokenRecord" },
            },
            timestamp: { type: "string", format: "date-time" },
          },
          required: ["success", "data", "timestamp"],
        },
        FcmCustomTopicSubscriptionRequest: {
          type: "object",
          required: ["topic", "subscribed"],
          properties: {
            topic: { type: "string", example: "product_updates" },
            subscribed: { type: "boolean", example: true },
          },
        },
        FcmCustomTopicsListResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                availableTopics: {
                  type: "array",
                  items: { type: "string" },
                  example: ["product_updates"],
                },
                subscribedTopics: {
                  type: "array",
                  items: { type: "string" },
                  example: ["product_updates"],
                },
              },
              required: ["availableTopics", "subscribedTopics"],
            },
            timestamp: { type: "string", format: "date-time" },
          },
          required: ["success", "data", "timestamp"],
        },
        FcmCustomTopicSubscriptionResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                customTopics: {
                  type: "array",
                  items: { type: "string" },
                },
                syncResult: {
                  type: "object",
                  properties: {
                    scannedTokens: { type: "integer", example: 2 },
                    updatedTokens: { type: "integer", example: 1 },
                  },
                  required: ["scannedTokens", "updatedTokens"],
                },
              },
              required: ["customTopics", "syncResult"],
            },
            timestamp: { type: "string", format: "date-time" },
          },
          required: ["success", "data", "timestamp"],
        },
        NewsletterSubscriber: {
          type: "object",
          description:
            "Subscriber row returned by admin list (unsubscribe token is never exposed)",
          properties: {
            id: { type: "string" },
            email: { type: "string", format: "email" },
            locale: { type: "string", nullable: true, enum: ["ar", "en"] },
            status: { type: "string", enum: ["active", "unsubscribed"] },
            createdAt: { type: "string", format: "date-time" },
            unsubscribedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
          required: ["id", "email", "status", "createdAt"],
        },
        NewsletterCampaign: {
          type: "object",
          properties: {
            id: { type: "string" },
            subjectAr: {
              type: "string",
              description:
                "Email subject for Arabic-locale subscribers (and default locale).",
            },
            subjectEn: {
              type: "string",
              description: "Email subject for English-locale subscribers.",
            },
            bodyAr: {
              type: "string",
              description:
                "Trusted Arabic HTML; list footer is injected at send time. Subscribers with locale ar (or unset) receive this body.",
            },
            bodyEn: {
              type: "string",
              description:
                "Trusted English HTML; subscribers with locale en receive this body.",
            },
            status: {
              type: "string",
              enum: ["draft", "queued", "sending", "completed", "failed"],
            },
            failureReason: { type: "string", nullable: true },
            createdBy: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            startedAt: { type: "string", format: "date-time", nullable: true },
            completedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
          required: [
            "id",
            "subjectAr",
            "subjectEn",
            "bodyAr",
            "bodyEn",
            "status",
            "createdBy",
            "createdAt",
          ],
        },
        NewsletterCampaignListItem: {
          type: "object",
          description:
            "Campaign row returned by GET /content/newsletter/campaigns (no bodyAr/bodyEn)",
          properties: {
            id: { type: "string" },
            subjectAr: { type: "string" },
            subjectEn: { type: "string" },
            status: {
              type: "string",
              enum: ["draft", "queued", "sending", "completed", "failed"],
            },
            failureReason: { type: "string", nullable: true },
            createdBy: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            startedAt: { type: "string", format: "date-time", nullable: true },
            completedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
          required: [
            "id",
            "subjectAr",
            "subjectEn",
            "status",
            "createdBy",
            "createdAt",
          ],
        },
        NewsletterCampaignDetail: {
          type: "object",
          description: "Campaign with aggregate send stats (admin GET by id)",
          properties: {
            id: { type: "string" },
            subjectAr: { type: "string" },
            subjectEn: { type: "string" },
            bodyAr: { type: "string" },
            bodyEn: { type: "string" },
            status: {
              type: "string",
              enum: ["draft", "queued", "sending", "completed", "failed"],
            },
            failureReason: { type: "string", nullable: true },
            createdBy: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            startedAt: { type: "string", format: "date-time", nullable: true },
            completedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            sendCounts: {
              type: "object",
              properties: {
                sent: { type: "integer" },
                failed: { type: "integer" },
                pending: { type: "integer" },
              },
            },
            activeSubscriberTotal: { type: "integer" },
          },
        },
        CreateNewsletterCampaignRequest: {
          type: "object",
          required: ["subjectAr", "subjectEn", "bodyAr", "bodyEn"],
          properties: {
            subjectAr: { type: "string", maxLength: 500 },
            subjectEn: { type: "string", maxLength: 500 },
            bodyAr: {
              type: "string",
              maxLength: 204800,
              description:
                "Arabic HTML; max length enforced server-side (~200KB)",
            },
            bodyEn: {
              type: "string",
              maxLength: 204800,
              description:
                "English HTML; max length enforced server-side (~200KB)",
            },
          },
        },
        UpdateNewsletterCampaignRequest: {
          type: "object",
          properties: {
            subjectAr: { type: "string", maxLength: 500 },
            subjectEn: { type: "string", maxLength: 500 },
            bodyAr: { type: "string", maxLength: 204800 },
            bodyEn: { type: "string", maxLength: 204800 },
          },
          description: "At least one property required (validated server-side)",
        },
      },
    },
    paths: {
      "/api/plans": {
        get: {
          summary: "List subscription plans and feature gates",
          tags: ["Subscriptions"],
          responses: {
            200: { description: "Plan map returned" },
          },
        },
      },
      "/api/entitlements": {
        get: {
          summary: "Get current user entitlements",
          tags: ["Subscriptions"],
          security: [{ sessionAuth: [] }],
          responses: {
            200: { description: "Resolved plan and features returned" },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/subscription": {
        get: {
          summary: "Get current user subscription",
          tags: ["Subscriptions"],
          security: [{ sessionAuth: [] }],
          responses: {
            200: { description: "Subscription returned (or null)" },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/subscription/invoices": {
        get: {
          summary: "List current user invoices",
          tags: ["Subscriptions"],
          security: [{ sessionAuth: [] }],
          responses: {
            200: { description: "Invoices returned" },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/subscription/checkout": {
        post: {
          summary: "Create subscription checkout session",
          tags: ["Subscriptions"],
          security: [{ sessionAuth: [] }],
          responses: {
            201: { description: "Checkout payload returned" },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/subscription/cancel": {
        post: {
          summary: "Disable auto-renew for current user subscription",
          tags: ["Subscriptions"],
          security: [{ sessionAuth: [] }],
          responses: {
            200: { description: "Cancellation state updated" },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/subscription/resume": {
        post: {
          summary: "Resume current user subscription",
          tags: ["Subscriptions"],
          security: [{ sessionAuth: [] }],
          responses: {
            200: { description: "Resume state updated" },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/webhooks/paymob": {
        post: {
          summary: "Paymob webhook receiver",
          tags: ["Webhooks"],
          responses: {
            200: { description: "Webhook accepted" },
          },
        },
      },
      "/api/webhooks/kashier": {
        post: {
          summary: "Kashier webhook receiver",
          tags: ["Webhooks"],
          responses: {
            200: { description: "Webhook accepted" },
          },
        },
      },
      "/api/admin/subscriptions": {
        get: {
          summary: "List subscriptions (admin)",
          tags: ["Subscriptions Admin"],
          security: [{ sessionAuth: [] }],
          responses: {
            200: { description: "Paginated subscriptions returned" },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            403: {
              description: "Forbidden",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/admin/subscriptions/user/{userId}": {
        get: {
          summary: "Get subscription details by user ID (admin)",
          description:
            "Uses user ID from users table. For direct subscription UUID lookup, use /api/admin/subscriptions/{id}.",
          tags: ["Subscriptions Admin"],
          security: [{ sessionAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "userId",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Subscription details returned" },
            404: {
              description: "User not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            403: {
              description: "Forbidden",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/admin/subscriptions/{id}": {
        get: {
          summary: "Get subscription details by subscription ID (admin)",
          description:
            "Uses subscription row id. For user-based lookup, use /api/admin/subscriptions/user/{userId}.",
          tags: ["Subscriptions Admin"],
          security: [{ sessionAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Subscription details returned" },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            403: {
              description: "Forbidden",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            404: {
              description: "Subscription not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/admin/subscriptions/activate": {
        post: {
          summary: "Activate subscription manually (admin)",
          description:
            "Creates a manual active subscription for a user, logs a manually_activated event, and creates an initial invoice.",
          tags: ["Subscriptions Admin"],
          security: [{ sessionAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId", "plan", "paymentMethod"],
                  properties: {
                    userId: { type: "string" },
                    plan: {
                      type: "string",
                      enum: ["pro", "business"],
                    },
                    autoRenew: {
                      type: "boolean",
                      default: false,
                    },
                    notes: {
                      type: "string",
                      maxLength: 1000,
                    },
                    paymentMethod: {
                      type: "string",
                      enum: ["cash", "bank_transfer", "online"],
                    },
                    paymentReference: {
                      type: "string",
                      maxLength: 255,
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Activation accepted" },
            404: {
              description: "User not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            409: {
              description: "Conflict - user already has a subscription row",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            403: {
              description: "Forbidden",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/admin/subscriptions/{id}/extend": {
        patch: {
          summary: "Extend subscription period (admin)",
          description:
            "Extends a subscription expiry by a specified number of days and records an admin_extended event.",
          tags: ["Subscriptions Admin"],
          security: [{ sessionAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["addedDays"],
                  properties: {
                    addedDays: {
                      type: "integer",
                      minimum: 1,
                    },
                    notes: {
                      type: "string",
                      maxLength: 1000,
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Subscription extended" },
            404: {
              description: "Subscription not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            403: {
              description: "Forbidden",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/admin/subscriptions/{id}/change-plan": {
        patch: {
          summary: "Change subscription plan (admin)",
          description:
            "Changes an existing subscription to a new plan, resets the billing period from now based on target plan renewal days, records an admin_plan_changed event, and creates a new invoice for the new cycle.",
          tags: ["Subscriptions Admin"],
          security: [{ sessionAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["plan", "paymentMethod"],
                  properties: {
                    plan: {
                      type: "string",
                      enum: ["pro", "business"],
                      description: "Target plan to switch to.",
                    },
                    notes: {
                      type: "string",
                      maxLength: 1000,
                      description:
                        "Optional internal note for the change event.",
                    },
                    paymentMethod: {
                      type: "string",
                      enum: ["cash", "bank_transfer", "online"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Plan changed" },
            404: {
              description: "Subscription not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            403: {
              description: "Forbidden",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/admin/subscriptions/{id}/cancel": {
        post: {
          summary: "Cancel subscription (admin)",
          description:
            "Cancels a subscription immediately by setting plan expiry to now, then records an admin_cancelled event.",
          tags: ["Subscriptions Admin"],
          security: [{ sessionAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["paymentMethod"],
                  properties: {
                    paymentMethod: {
                      type: "string",
                      enum: [
                        "gateway",
                        "bank_transfer",
                        "vodafone_cash",
                        "instapay",
                        "complimentary",
                        "fix",
                      ],
                    },
                    paymentReference: {
                      type: "string",
                      maxLength: 255,
                    },
                    notes: {
                      type: "string",
                      maxLength: 1000,
                      description:
                        "Optional internal admin note for cancellation",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Subscription cancelled" },
            404: {
              description: "Subscription not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            403: {
              description: "Forbidden",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/admin/subscriptions/{id}/events": {
        get: {
          summary: "List subscription events timeline (admin)",
          tags: ["Subscriptions Admin"],
          security: [{ sessionAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Events returned" },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            403: {
              description: "Forbidden",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/admin/invoices/{id}/refund": {
        patch: {
          summary: "Manually refund an invoice (admin)",
          description:
            "Refunds invoice amount, updates invoice refund status, optionally revokes subscription access, and records a payment_refunded event.",
          tags: ["Subscriptions Admin"],
          security: [{ sessionAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["refundedAmount", "reason", "revokeAccess"],
                  properties: {
                    refundedAmount: {
                      type: "integer",
                      minimum: 1,
                    },
                    reason: {
                      type: "string",
                      minLength: 1,
                      maxLength: 1000,
                    },
                    notes: {
                      type: "string",
                      maxLength: 1000,
                    },
                    revokeAccess: {
                      type: "boolean",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Invoice refunded" },
            404: {
              description: "Invoice not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            422: {
              description:
                "Validation failed (refund is not allowed for current status or amount exceeds allowable value)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            403: {
              description: "Forbidden",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/admin/subscriptions/{id}/notes": {
        patch: {
          summary: "Update subscription notes (admin)",
          description:
            "Updates internal subscription notes. Send null to clear existing notes.",
          tags: ["Subscriptions Admin"],
          security: [{ sessionAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    notes: {
                      type: "string",
                      maxLength: 1000,
                      nullable: true,
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Subscription notes updated" },
            404: {
              description: "Subscription not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            403: {
              description: "Forbidden",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/admin/subscriptions/{id}/renew": {
        post: {
          summary: "Renew subscription by plan renewal period (admin)",
          description:
            "Renews a subscription by extending expiry using current plan renewal days, records a subscription_renewed event, and creates a paid invoice for the renewal period.",
          tags: ["Subscriptions Admin"],
          security: [{ sessionAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    notes: {
                      type: "string",
                      maxLength: 1000,
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Subscription renewed" },
            404: {
              description: "Subscription not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            403: {
              description: "Forbidden",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Auth",
        description:
          "Better Auth at `/api/auth/*`. POSTs expect **Content-Type: application/json** (use `{}` for sign-out). Email: `/sign-in/email`, `/sign-up/email`, `/request-password-reset`, `/reset-password`, `/change-password`. Session: **GET /get-session** (not `/session`). OAuth: **POST /sign-in/social** then provider hits **GET /callback/{provider}**. Uses **session** cookie.",
      },
      {
        name: "Admin",
        description: "Admin only endpoints",
      },
      {
        name: "Health",
        description: "Health check endpoints",
      },
      {
        name: "Todos",
        description: "Todo management endpoints",
      },
      {
        name: "Projects",
        description: "Project management endpoints",
      },
      {
        name: "Blogs",
        description: "Blog content management and public blog endpoints",
      },
      {
        name: "Support",
        description: "Support tickets management endpoints",
      },
      {
        name: "Feedbacks",
        description: "User feedback and support triage endpoints",
      },
      {
        name: "Announcements",
        description:
          "Targeted user announcements and admin publishing endpoints",
      },
      {
        name: "Content",
        description:
          "Content workspace — assets, blogs, newsletter (content manager or admin)",
      },
      {
        name: "Dashboard",
        description: "User dashboard endpoints",
      },
      {
        name: "Newsletter",
        description:
          "Marketing newsletter — public subscribe/unsubscribe; content-workspace subscribers and campaigns (content manager or admin); delivery uses Resend and Upstash QStash (webhook not documented here)",
      },
      {
        name: "FCM",
        description:
          "Firebase Cloud Messaging token registration endpoints for authenticated users",
      },
      {
        name: "Subscriptions",
        description:
          "Subscription plans, entitlements, and user billing endpoints",
      },
      {
        name: "Subscriptions Admin",
        description: "Admin subscription management endpoints",
      },
      {
        name: "Coupons Admin",
        description: "Admin coupon management endpoints",
      },
      {
        name: "Webhooks",
        description: "Inbound webhook receivers for external providers",
      },
      {
        name: "API Documentation",
        description: "API specification endpoints",
      },
    ],
  },
  apis: ["./src/app/api/**/*.ts"],
};

export const swaggerOptions = options;

type SwaggerSpec = Record<string, unknown> & {
  paths?: Record<string, unknown>;
  servers?: Array<{ url: string; description?: string }>;
};

export function getSwaggerSpec(): SwaggerSpec {
  let spec: SwaggerSpec = staticSpec as unknown as SwaggerSpec;

  if (process.env.NODE_ENV === "development") {
    try {
      const dynamicSpec = swaggerJsdoc(options) as SwaggerSpec;
      if (dynamicSpec && Object.keys(dynamicSpec.paths || {}).length > 0) {
        spec = dynamicSpec;
      }
    } catch (err) {
      console.warn(
        "[swagger] Failed to generate dynamic spec, falling back to pre-built spec:",
        err,
      );
      spec = staticSpec as unknown as SwaggerSpec;
    }
  }

  const serverUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    ...spec,
    servers: [
      {
        url: serverUrl,
        description: "API Server",
      },
    ],
  };
}
