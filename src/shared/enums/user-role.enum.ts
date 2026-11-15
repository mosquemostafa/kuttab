export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  SUPPORT = "support",
  CONTENT = "content",
  STUDENT = "student",
  PARENT = "parent",
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

/** Maps each system role to its landing dashboard path. */
export const ROLE_DASHBOARD_MAP: Record<UserRole, string> = {
  [UserRole.ADMIN]: "/admin/overview",
  [UserRole.SUPPORT]: "/support/overview",
  [UserRole.CONTENT]: "/content/overview",
  [UserRole.STUDENT]: "/student/overview",
  [UserRole.PARENT]: "/parent/overview",
  [UserRole.USER]: "/dashboard/overview",
};

/** Maps dashboard route prefixes to their authorized target role. */
export const DASHBOARD_ROLE_MAP: Record<string, UserRole> = {
  "/admin": UserRole.ADMIN,
  "/support": UserRole.SUPPORT,
  "/content": UserRole.CONTENT,
  "/student": UserRole.STUDENT,
  "/parent": UserRole.PARENT,
  "/dashboard": UserRole.USER,
};

/** Extract the dashboard root prefix from a pathname if it belongs to one. */
export function getDashboardPrefix(pathname: string): string | null {
  const cleanPath = stripLocale(pathname);
  for (const prefix of Object.keys(DASHBOARD_ROLE_MAP)) {
    if (cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)) {
      return prefix;
    }
  }
  return null;
}

/** Check if a given pathname belongs to any of the dashboard surface families. */
export function isDashboardPath(pathname: string): boolean {
  return getDashboardPrefix(pathname) !== null;
}

/** Get the root overview path for a given user role. */
export function getDashboardPathForRole(
  role: string | null | undefined,
): string {
  const normalized = normalizeUserRole(role);
  return ROLE_DASHBOARD_MAP[normalized] ?? "/dashboard/overview";
}

const SHARED_DASHBOARD_PREFIXES = [
  "/dashboard/notifications",
  "/dashboard/newsletter",
  "/dashboard/support",
  "/dashboard/feedbacks",
  "/dashboard/settings",
];

/** Check if a pathname is a shared dashboard utility route accessible to any authenticated role. */
export function isSharedDashboardPath(pathname: string): boolean {
  const cleanPath = stripLocale(pathname);
  return SHARED_DASHBOARD_PREFIXES.some(
    (prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`),
  );
}

/**
 * Validate whether a user with the given role is authorized to access a dashboard pathname.
 * Returns true if the pathname is not a dashboard path, if it is a shared utility path,
 * or if the user's role matches the target role.
 */
export function isAllowedDashboardForRole(
  role: string | null | undefined,
  pathname: string,
): boolean {
  if (isSharedDashboardPath(pathname)) {
    return true;
  }
  const prefix = getDashboardPrefix(pathname);
  if (!prefix) {
    return true;
  }
  return normalizeUserRole(role) === DASHBOARD_ROLE_MAP[prefix];
}
