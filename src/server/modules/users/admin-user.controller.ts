import { NextResponse } from "next/server";
import { auth } from "@/server/lib/auth";
import type { NextRequest } from "next/server";

import {
  banUserSchema,
  createUserSchema,
  updateRoleSchema,
  updateUserSegmentSchema,
} from "@/server/modules/users/dto/admin-mutations.dto";
import { validateBody } from "@/server/pipes/validate.pipe";
import { userService } from "@/server/modules/users/user.service";
import type { ApiSuccess } from "@/shared/types/api-response.types";

function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export const adminUserController = {
  async createUser(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(createUserSchema, body);
    const result = await userService.createUser(input, req.headers);
    return ok(result, 201);
  },

  async updateUserRole(
    req: NextRequest,
    userId: string,
  ): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateRoleSchema, body);
    const result = await userService.updateUserRole(
      userId,
      input.role as import("@/shared/enums/user-role.enum").UserRole,
      req.headers,
    );
    return ok(result);
  },

  async updateUserSegment(
    req: NextRequest,
    userId: string,
  ): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateUserSegmentSchema, body);
    const result = await userService.updateUserSegment(
      userId,
      input.segmentId,
      req.headers,
    );
    return ok(result);
  },

  async banUser(req: NextRequest, userId: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(banUserSchema, body);
    const result = await userService.banUser(
      userId,
      input.banReason,
      input.banExpiresIn,
      req.headers,
    );
    return ok(result);
  },

  async unbanUser(req: NextRequest, userId: string): Promise<NextResponse> {
    const result = await userService.unbanUser(userId, req.headers);
    return ok(result);
  },

  async deleteUser(req: NextRequest, userId: string): Promise<NextResponse> {
    const result = await userService.deleteUser(userId, req.headers);
    return ok(result);
  },

  async revokeSessions(
    req: NextRequest,
    userId: string,
  ): Promise<NextResponse> {
    const result = await userService.revokeUserSessions(userId, req.headers);
    return ok(result);
  },

  async impersonate(req: NextRequest, userId: string): Promise<NextResponse> {
    const result = await userService.impersonateUser(userId, req.headers);

    // If service returned a token (fallback), set session cookie for browser.
    if (result && typeof result === "object" && "token" in result) {
      const { token, expiresAt } = result as {
        token: string;
        expiresAt: string;
      };

      // Prefer reading cookie name from Better Auth config if available, otherwise
      // fall back to the library's default session cookie name. Avoid using
      // internal helpers like `getCookies()` which are not part of the public API.
      type MaybeAuthOptions = {
        options?: { cookies?: { sessionToken?: { name?: string } } };
      };
      const SESSION_COOKIE_NAME =
        (auth as unknown as MaybeAuthOptions).options?.cookies?.sessionToken
          ?.name || "better-auth.session_token";

      const res = NextResponse.json(
        {
          success: true,
          data: { token, expiresAt },
          timestamp: new Date().toISOString(),
        },
        { status: 200 },
      );

      try {
        res.cookies.set({
          name: SESSION_COOKIE_NAME,
          value: token,
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          expires: new Date(expiresAt),
        });
      } catch (err) {
        console.error("Failed to set impersonation cookie:", err);
        throw new Error("Failed to set session cookie");
      }

      return res;
    }

    return ok(result as unknown as Record<string, unknown>);
  },
};
