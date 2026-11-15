import swaggerJsdoc from "swagger-jsdoc";
import staticSpec from "./swagger-spec.json";

import { COLOR_KEYS } from "@/shared/constants/color-palette";

const SWAGGER_COLOR_KEY_ENUM = [...COLOR_KEYS];

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Almostafa API",
      version: "1.0.0",
      description: "API documentation for Almostafa Quran Institute",
      contact: {
        name: "Almostafa Team",
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
        Student: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string", nullable: true },
            name: { type: "string" },
            birthDate: { type: "string", format: "date", nullable: true },
            grade: { type: "string", nullable: true },
            job: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            studiedTajweed: { type: "boolean" },
            previouslyEnrolled: { type: "boolean" },
            previousEnrolledPlace: { type: "string", nullable: true },
            memorizedPartsCount: { type: "integer", minimum: 0, maximum: 30 },
            memorizationDetails: { type: "string", nullable: true },
            status: {
              type: "string",
              enum: ["active", "archived", "rejected"],
            },
            registrationDate: { type: "string", format: "date" },
            notes: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "id",
            "name",
            "studiedTajweed",
            "previouslyEnrolled",
            "memorizedPartsCount",
            "status",
            "registrationDate",
            "createdAt",
            "updatedAt",
          ],
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
            phone: { type: "string" },
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
    paths: {},
    tags: [
      {
        name: "Auth",
        description:
          "Better Auth at `/api/auth/*`. POSTs expect **Content-Type: application/json** (use `{}` for sign-out). Email: `/sign-in/email`, `/sign-up/email`, `/request-password-reset`, `/reset-password`, `/change-password`. Session: **GET /get-session** (not `/session`). Uses **session** cookie.",
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
          "Content workspace — newsletter (content manager or admin)",
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
        name: "Students",
        description: "Student management endpoints (Admin only)",
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
