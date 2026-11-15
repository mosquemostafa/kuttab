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

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
}

/** Check if a given pathname belongs to any of the 4 dashboard surface families. */
export function isDashboardPath(pathname: string): boolean {
  const cleanPath = stripLocale(pathname);
  return (
    cleanPath === "/admin" ||
    cleanPath.startsWith("/admin/") ||
    cleanPath === "/content" ||
    cleanPath.startsWith("/content/") ||
    cleanPath === "/support" ||
    cleanPath.startsWith("/support/") ||
    cleanPath === "/dashboard" ||
    cleanPath.startsWith("/dashboard/")
  );
}

/** Get the root overview path for a given user role. */
export function getDashboardPathForRole(
  role: string | null | undefined,
): string {
  switch (role) {
    case UserRole.ADMIN:
      return "/admin/overview";
    case UserRole.SUPPORT:
      return "/support/overview";
    case UserRole.CONTENT_MANAGER:
    case "content":
      return "/content/overview";
    case UserRole.USER:
    default:
      return "/dashboard/overview";
  }
}

/**
 * Validate whether a user with the given role is authorized to access a dashboard pathname.
 * Returns true if the pathname is not a dashboard path, or if the role matches the dashboard.
 */
export function isAllowedDashboardForRole(
  role: string | null | undefined,
  pathname: string,
): boolean {
  const cleanPath = stripLocale(pathname);

  if (cleanPath === "/admin" || cleanPath.startsWith("/admin/")) {
    return role === UserRole.ADMIN;
  }
  if (cleanPath === "/support" || cleanPath.startsWith("/support/")) {
    return role === UserRole.SUPPORT;
  }
  if (cleanPath === "/content" || cleanPath.startsWith("/content/")) {
    return role === UserRole.CONTENT_MANAGER || role === "content";
  }
  if (cleanPath === "/dashboard" || cleanPath.startsWith("/dashboard/")) {
    return (
      normalizeUserRole(role) === UserRole.USER &&
      role !== UserRole.ADMIN &&
      role !== UserRole.SUPPORT &&
      role !== UserRole.CONTENT_MANAGER &&
      role !== "content"
    );
  }

  return true;
}

