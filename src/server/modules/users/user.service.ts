import { auth } from "@/server/lib/auth";
import { env, r2AvatarStorageEnabled } from "@/server/lib/env";
import { db } from "@/server/db";
import { session } from "@/server/modules/users/user.entity";
import { createHmac, randomBytes, randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { segmentRepository } from "@/server/modules/segments/segment.repository";
import { userMediaFile } from "@/server/modules/user-media/user-media.entity";
import { deleteR2Object } from "@/server/lib/r2";

import {
  NotFoundException,
  UnauthorizedException,
} from "@/server/exceptions/exceptions";
import { userRepository } from "@/server/modules/users/user.repository";
import { fcmService } from "@/server/modules/fcm/fcm.service";
import {
  isAuthManagedRole,
  mapRoleForAuth,
  normalizeUserRole,
  UserRole,
} from "@/shared/enums/user-role.enum";
import type {
  ParsedPagination,
  ParsedUserFilters,
} from "@/server/pipes/parse-pagination.pipe";
import type { PaginatedResponse } from "@/shared/types/pagination.types";
import type { UserWithDetailsDTO } from "@/shared/types/user.types";
import type { CreateUserDTO } from "@/server/modules/users/dto/admin-mutations.dto";

interface LinkedAccount {
  providerId: string;
  picture?: string;
}

interface DashboardSettingsOverviewDTO {
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  hasPasswordLogin: boolean;
  /** True when server-side R2 is configured for direct avatar uploads. */
  avatarR2UploadEnabled: boolean;
}

function decodeGooglePicture(idToken: string): string | undefined {
  try {
    const base64Url = idToken.split(".")[1];
    if (!base64Url) {
      return undefined;
    }

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join(""),
    );

    const payload = JSON.parse(jsonPayload) as { picture?: string };
    return payload.picture;
  } catch {
    return undefined;
  }
}

function toDTO(
  user: Awaited<ReturnType<typeof userRepository.findById>> extends infer T
    ? NonNullable<T>
    : never,
): UserWithDetailsDTO {
  const role = normalizeUserRole(user.role);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    emailVerified: user.emailVerified,
    role,
    segmentId: user.segmentId,
    segment:
      user.segmentId && user.segmentName && user.segmentIcon
        ? {
            id: user.segmentId,
            name: user.segmentName,
            icon: user.segmentIcon,
          }
        : null,
    banned: Boolean(user.banned),
    banReason: user.banReason,
    banExpires: user.banExpires?.toISOString() ?? null,
    image: user.image,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    accounts: user.accounts,
    lastSignIn: user.lastSignIn?.toISOString() ?? null,
    avatarUrl: user.image,
  };
}

export const userService = {
  async getDashboardSettingsOverview(
    userId: string,
  ): Promise<DashboardSettingsOverviewDTO> {
    const profile = await userRepository.findProfileById(userId);

    if (!profile) {
      throw new NotFoundException("User", userId);
    }

    const hasPasswordLogin = await this.hasPasswordLoginEnabled(userId);

    return {
      name: profile.name,
      email: profile.email,
      phone: profile.phone ?? null,
      image: profile.image,
      hasPasswordLogin,
      avatarR2UploadEnabled: r2AvatarStorageEnabled,
    };
  },

  async listUsers(
    pagination: ParsedPagination,
    filters: ParsedUserFilters,
    headers: Headers,
  ): Promise<PaginatedResponse<UserWithDetailsDTO>> {
    const { users, total } = await userRepository.findMany(
      pagination,
      filters,
      headers,
    );

    return {
      items: users.map(toDTO),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  },

  async getUserById(id: string): Promise<UserWithDetailsDTO> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundException("User", id);
    }
    return toDTO(user);
  },

  async banUser(
    userId: string,
    banReason: string,
    banExpiresIn: number | undefined,
    headers: Headers,
  ) {
    const res = await auth.api.banUser({
      headers,
      body: {
        userId,
        banReason,
        banExpiresIn,
      },
    });
    return res;
  },

  async unbanUser(userId: string, headers: Headers) {
    const res = await auth.api.unbanUser({
      headers,
      body: { userId },
    });
    return res;
  },

  async deleteUser(userId: string, headers: Headers) {
    const res = await auth.api.removeUser({
      headers,
      body: { userId },
    });
    return res;
  },

  async deleteMyAccount(userId: string, headers: Headers): Promise<void> {
    const session = await auth.api.getSession({ headers });

    if (!session?.user?.id || session.user.id !== userId) {
      throw new UnauthorizedException();
    }

    if (r2AvatarStorageEnabled) {
      try {
        const mediaFiles = await db
          .select({ objectKey: userMediaFile.objectKey })
          .from(userMediaFile)
          .where(eq(userMediaFile.uploadedBy, userId));

        for (const file of mediaFiles) {
          try {
            await deleteR2Object(file.objectKey);
          } catch {
            // best-effort
          }
        }
      } catch (e) {
        console.error("Failed to delete user media files", e);
      }
    }

    await userRepository.deleteById(userId);
  },

  async revokeUserSessions(userId: string, headers: Headers) {
    const res = await auth.api.revokeUserSessions({
      headers,
      body: { userId },
    });
    return res;
  },

  async updateUserRole(userId: string, role: UserRole, headers: Headers) {
    const existing = await userRepository.findById(userId);
    if (!existing) {
      throw new NotFoundException("User", userId);
    }

    if (!isAuthManagedRole(role)) {
      await userRepository.updateRoleById(userId, role);
      await fcmService.resyncUserTokenTopics(userId);
      return { userId, role };
    }

    const res = await auth.api.setRole({
      headers,
      body: { userId, role: mapRoleForAuth(role)! },
    });
    await fcmService.resyncUserTokenTopics(userId);
    return res;
  },

  async updateUserSegment(
    userId: string,
    segmentId: string | null,
    _headers: Headers,
  ) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException("User", userId);
    }

    if (segmentId) {
      const segment = await segmentRepository.findById(segmentId);

      if (!segment) {
        throw new NotFoundException("Segment", segmentId);
      }
    }

    await userRepository.updateSegmentById(userId, segmentId);
    await fcmService.resyncUserTokenTopics(userId);

    return {
      userId,
      segmentId,
    };
  },

  async completeOnboarding(headers: Headers): Promise<void> {
    const session = await auth.api.getSession({ headers });

    if (!session?.user?.id) {
      throw new UnauthorizedException();
    }

    await userRepository.markOnboarded(session.user.id);
  },

  async createUser(data: CreateUserDTO, headers: Headers) {
    const { autoVerify, phone, ...userData } = data;
    const requestedRole = userData.role;
    const roleForAuth = mapRoleForAuth(requestedRole);

    const createData = {
      ...userData,
      role: roleForAuth,
      data: {
        ...userData.data,
        ...(phone !== undefined ? { phone } : {}),
        ...(autoVerify ? { emailVerified: true } : {}),
      },
    };

    const res = await auth.api.createUser({
      headers,
      body: createData,
    });

    if (phone !== undefined && res?.user?.id) {
      await userRepository.updatePhoneById(res.user.id, phone);
    }

    if (!autoVerify) {
      try {
        await auth.api.sendVerificationEmail({
          body: {
            email: data.email,
            callbackURL: "/dashboard/overview",
          },
        });
      } catch (error) {
        console.error("Failed to send verification email:", error);
      }
    }

    if (requestedRole && !isAuthManagedRole(requestedRole)) {
      await userRepository.updateRoleByEmail(data.email, requestedRole);
    }

    return res;
  },

  async impersonateUser(userId: string, headers: Headers): Promise<unknown> {
    // Use Better Auth admin API when available.
    const apiCandidate = auth as unknown as { api?: unknown };
    const api = apiCandidate.api ?? (auth as unknown);

    const hasCreateSessionForUser =
      typeof (api as { createSessionForUser?: unknown })
        .createSessionForUser === "function";

    if (hasCreateSessionForUser) {
      return await (
        api as {
          createSessionForUser: (args: {
            headers: Headers;
            body: { userId: string };
          }) => Promise<unknown>;
        }
      ).createSessionForUser({ headers, body: { userId } });
    }

    const hasCreateImpersonation =
      typeof (api as { createImpersonation?: unknown }).createImpersonation ===
      "function";

    if (hasCreateImpersonation) {
      return await (
        api as {
          createImpersonation: (args: {
            headers: Headers;
            body: { userId: string };
          }) => Promise<unknown>;
        }
      ).createImpersonation({ headers, body: { userId } });
    }

    // Fallback: create a session row directly in DB and return token+expires.
    // WARNING: This bypasses Better Auth's internal session creation hooks/plugins
    // (for example any `onSession` hooks, session enrichment, or validation logic).
    // That means plugins or later changes in Better Auth may not observe this
    // session the same way as ones created by the official admin API. Use this
    // fallback only for debugging and be explicit about the risk. Ensure the
    // inserted row includes all non-nullable columns expected by the adapter.
    const targetUser = await userRepository.findById(userId);
    if (!targetUser) {
      throw new NotFoundException("User", userId);
    }

    // Determine admin id — hard fail if no active admin session
    const current = await auth.api.getSession({ headers });
    if (!current?.user?.id) {
      throw new UnauthorizedException("No active admin session");
    }
    const adminId = current.user.id;

    const token = randomBytes(24).toString("base64url").slice(0, 32);
    const signature = createHmac("sha256", env.BETTER_AUTH_SECRET)
      .update(token)
      .digest("base64");
    const signedToken = `${token}.${signature}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    const ipAddress =
      headers.get("x-forwarded-for") ?? headers.get("x-real-ip") ?? null;
    const userAgent = headers.get("user-agent") ?? null;

    const sessionId = randomUUID();

    await db.insert(session).values({
      id: sessionId,
      expiresAt,
      token,
      createdAt: now,
      updatedAt: now,
      ipAddress,
      userAgent,
      userId,
      impersonatedBy: adminId,
    });

    return {
      token: signedToken,
      expiresAt: expiresAt.toISOString(),
      sessionId,
    };
  },

  async getLinkedAccounts(userId: string): Promise<LinkedAccount[]> {
    const accounts = await userRepository.findLinkedAccountsByUserId(userId);

    const linkedAccounts: LinkedAccount[] = [];

    for (const account of accounts) {
      const linkedAccount: LinkedAccount = {
        providerId: account.providerId,
      };

      if (account.providerId === "google" && account.idToken) {
        linkedAccount.picture = decodeGooglePicture(account.idToken);
      }

      if (account.providerId === "github" && account.accessToken) {
        try {
          const response = await fetch("https://api.github.com/user", {
            headers: {
              Authorization: `Bearer ${account.accessToken}`,
            },
          });

          if (response.ok) {
            const userData = (await response.json()) as { avatar_url?: string };
            linkedAccount.picture = userData.avatar_url;
          }
        } catch {
          linkedAccount.picture = undefined;
        }
      }

      linkedAccounts.push(linkedAccount);
    }

    return linkedAccounts;
  },

  async updateUserImage(
    userId: string,
    imageUrl: string,
    headers: Headers,
  ): Promise<void> {
    const session = await auth.api.getSession({ headers });

    if (!session?.user?.id || session.user.id !== userId) {
      throw new UnauthorizedException();
    }

    await auth.api.updateUser({
      headers,
      body: {
        image: imageUrl,
      },
    });
  },

  async updateUserName(
    userId: string,
    name: string,
    headers: Headers,
  ): Promise<void> {
    await this.updateUserProfile(userId, { name }, headers);
  },

  async updateUserPhone(
    userId: string,
    phone: string | null,
    headers?: Headers,
  ): Promise<{ userId: string; phone: string | null }> {
    const existing = await userRepository.findById(userId);
    if (!existing) {
      throw new NotFoundException("User", userId);
    }

    if (headers) {
      const session = await auth.api.getSession({ headers });
      if (!session?.user?.id) {
        throw new UnauthorizedException();
      }
    }

    await userRepository.updatePhoneById(userId, phone);
    return { userId, phone };
  },

  async updateUserProfile(
    userId: string,
    data: { name: string; phone?: string | null },
    headers: Headers,
  ): Promise<void> {
    const session = await auth.api.getSession({ headers });

    if (!session?.user?.id || session.user.id !== userId) {
      throw new UnauthorizedException();
    }

    await auth.api.updateUser({
      headers,
      body: {
        name: data.name,
      },
    });

    if (data.phone !== undefined) {
      await userRepository.updatePhoneById(userId, data.phone);
    }
  },

  async changeUserPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    headers: Headers,
  ): Promise<void> {
    const session = await auth.api.getSession({ headers });

    if (!session?.user?.id || session.user.id !== userId) {
      throw new UnauthorizedException();
    }

    await auth.api.changePassword({
      headers,
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
    });
  },

  async setUserPassword(
    userId: string,
    newPassword: string,
    headers: Headers,
  ): Promise<void> {
    const session = await auth.api.getSession({ headers });

    if (!session?.user?.id || session.user.id !== userId) {
      throw new UnauthorizedException();
    }

    await auth.api.setPassword({
      headers,
      body: {
        newPassword,
      },
    });
  },

  async hasPasswordLoginEnabled(userId: string): Promise<boolean> {
    return userRepository.hasCredentialPasswordByUserId(userId);
  },
};
