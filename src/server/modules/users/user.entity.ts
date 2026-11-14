import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";
import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  emailVerified: boolean;
  image: string | null;
  role: string | null;
  segmentId: string | null;
  segmentName: string | null;
  segmentIcon: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isPublicKnowledgeProfile?: boolean;
  knowledgeBio?: string | null;
}

export interface UserWithDetailsEntity extends UserEntity {
  accounts: string[];
  lastSignIn: Date | null;
  subscriptionPlan: SubscriptionPlanEnum | null;
  subscriptionPlanExpiresAt: Date | null;
}

export const user = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone"),
    emailVerified: boolean("email_verified")
      .$defaultFn(() => false)
      .notNull(),
    image: text("image"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
    role: text("role"),
    segmentId: text("segment_id"),
    banned: boolean("banned"),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires"),
    onboarded: boolean("onboarded").default(false).notNull(),
    isPublicKnowledgeProfile: boolean("is_public_knowledge_profile")
      .default(false)
      .notNull(),
    knowledgeBio: text("knowledge_bio"),
  },
  (table) => [
    index("user_role_idx").on(table.role),
    index("user_segment_id_idx").on(table.segmentId),
  ],
);

export const session = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});
