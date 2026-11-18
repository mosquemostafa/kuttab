import swaggerJsdoc from "swagger-jsdoc";
import staticSpec from "./swagger-spec.json";

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
            classId: { type: "string", nullable: true },
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
              enum: ["active", "archived", "rejected", "pending"],
            },
            paymentMethod: {
              type: "string",
              enum: [
                "exempt_poor",
                "installments",
                "exempt_staff_kids",
                "special",
                "monthly",
                "yearly",
                "sponsored",
              ],
              nullable: true,
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
        Teacher: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string", nullable: true },
            name: { type: "string" },
            phone: { type: "string", nullable: true },
            studentType: {
              type: "string",
              enum: ["foundation", "khatimeen", "children", "adults"],
              nullable: true,
            },
            status: {
              type: "string",
              enum: ["active", "archived"],
            },
            sallary: { type: "integer", nullable: true, minimum: 0 },
            notes: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: ["id", "name", "status", "createdAt", "updatedAt"],
        },
        Class: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            primaryTeacherId: { type: "string", nullable: true },
            secondaryTeacherId: { type: "string", nullable: true },
            classType: {
              type: "string",
              enum: ["group", "individual"],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: ["id", "name", "classType", "createdAt", "updatedAt"],
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
        name: "Users",
        description: "Current-user and user selection endpoints",
      },
      {
        name: "Notifications",
        description: "User notification endpoints",
      },
      {
        name: "Contact",
        description: "Public contact endpoints",
      },
      {
        name: "Teacher Attendances",
        description: "Teacher attendance and salary reporting endpoints",
      },
      {
        name: "User Media",
        description: "User media and editor upload endpoints",
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
        name: "Teachers",
        description: "Teacher management endpoints (Admin only)",
      },
      {
        name: "Classes",
        description: "Class management endpoints (Admin only)",
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
