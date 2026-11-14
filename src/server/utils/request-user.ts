import type { NextRequest } from "next/server";

import { UnauthorizedException } from "@/server/exceptions/exceptions";
import { normalizeUserRole, UserRole } from "@/shared/enums/user-role.enum";

export type SessionUserRequest = NextRequest & {
  session?: {
    user?: {
      id?: string;
      role?: string;
    };
  };
};

export function getUserId(req: NextRequest): string {
  const userId = (req as SessionUserRequest).session?.user?.id;

  if (!userId) {
    throw new UnauthorizedException();
  }

  return userId;
}

export function getUserRole(req: NextRequest): UserRole {
  const role = (req as SessionUserRequest).session?.user?.role;
  return normalizeUserRole(role);
}
