export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  SUPPORT = "support",
  CONTENT_MANAGER = "content_manager",
}

const USER_ROLE_VALUES = new Set<UserRole>(Object.values(UserRole));

const AUTH_MANAGED_ROLES = new Set<UserRole>([UserRole.USER, UserRole.ADMIN]);

/** Parse a role string coming from persistence/session into a known role. */
function parseUserRole(role: string | null | undefined): UserRole | null {
  if (!role) {
    return null;
  }

  return USER_ROLE_VALUES.has(role as UserRole) ? (role as UserRole) : null;
}

/** Normalize unknown/null roles to USER for safe app behavior. */
export function normalizeUserRole(role: string | null | undefined): UserRole {
  return parseUserRole(role) ?? UserRole.USER;
}

/** Roles Better Auth can set directly via setRole/createUser body.role. */
export function isAuthManagedRole(
  role: UserRole,
): role is UserRole.USER | UserRole.ADMIN {
  return AUTH_MANAGED_ROLES.has(role);
}

/**
 * Map app role to Better Auth role payload.
 * Any non-admin role is created/updated as "user" and can be promoted in DB after creation.
 */
export function mapRoleForAuth(
  role: UserRole | undefined,
): "user" | "admin" | undefined {
  if (!role) {
    return undefined;
  }

  return role === UserRole.ADMIN ? "admin" : "user";
}
