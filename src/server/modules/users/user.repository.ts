import { db } from "@/server/db";
import { segment } from "@/server/modules/segments/segment.entity";
import { account, session, user } from "@/server/modules/users/user.entity";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";

import type { UserWithDetailsEntity } from "@/server/modules/users/user.entity";
import type { SelectUserItem } from "@/shared/types/select.types";
import type {
  ParsedPagination,
  ParsedUserFilters,
} from "@/server/pipes/parse-pagination.pipe";

function buildAccountMap(
  accounts: { userId: string; providerId: string }[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const acc of accounts) {
    if (!map.has(acc.userId)) map.set(acc.userId, []);
    map.get(acc.userId)!.push(acc.providerId);
  }
  return map;
}

function buildLastSignInMap(
  sessions: { userId: string; createdAt: Date }[],
): Map<string, Date> {
  const map = new Map<string, Date>();
  for (const s of sessions) {
    const existing = map.get(s.userId);
    if (!existing || s.createdAt > existing) {
      map.set(s.userId, s.createdAt);
    }
  }
  return map;
}

export const userRepository = {
  async hasCredentialPasswordByUserId(userId: string): Promise<boolean> {
    const credentialAccount = await db
      .select({ id: account.id })
      .from(account)
      .where(
        and(
          eq(account.userId, userId),
          eq(account.providerId, "credential"),
          isNotNull(account.password),
        ),
      )
      .limit(1);

    return credentialAccount.length > 0;
  },

  async findProfileById(id: string): Promise<{
    id: string;
    name: string;
    email: string;
    phone: string;
    image: string | null;
  } | null> {
    const result = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    return result[0] ?? null;
  },

  async findMany(
    pagination: ParsedPagination,
    filters: ParsedUserFilters,
    _headers?: Headers,
  ): Promise<{ users: UserWithDetailsEntity[]; total: number }> {
    const conditions: SQL[] = [];

    if (filters.email?.trim()) {
      conditions.push(ilike(user.email, `%${filters.email.trim()}%`));
    }

    if (filters.name?.trim()) {
      conditions.push(ilike(user.name, `%${filters.name.trim()}%`));
    }

    if (filters.phone?.trim()) {
      conditions.push(ilike(user.phone, `%${filters.phone.trim()}%`));
    }

    if (filters.role && filters.role !== "all") {
      conditions.push(eq(user.role, filters.role));
    }

    if (filters.status && filters.status !== "all") {
      if (filters.status === "banned") {
        conditions.push(eq(user.banned, true));
      } else if (filters.status === "active") {
        conditions.push(or(eq(user.banned, false), isNull(user.banned))!);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const isAsc = filters.sortDirection === "asc";
    const direction = isAsc ? asc : desc;

    let orderByClause: SQL;
    switch (filters.sortBy) {
      case "name":
        orderByClause = direction(user.name);
        break;
      case "email":
        orderByClause = direction(user.email);
        break;
      case "phone":
        orderByClause = direction(user.phone);
        break;
      case "role":
        orderByClause = direction(user.role);
        break;
      case "segmentId":
        orderByClause = direction(user.segmentId);
        break;
      case "updatedAt":
        orderByClause = direction(user.updatedAt);
        break;
      case "createdAt":
      default:
        orderByClause = direction(user.createdAt);
        break;
    }

    const [totalResult, rows] = await Promise.all([
      db.select({ total: count() }).from(user).where(whereClause),
      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          emailVerified: user.emailVerified,
          image: user.image,
          role: user.role,
          segmentId: user.segmentId,
          segmentName: segment.name,
          segmentIcon: segment.icon,
          banned: user.banned,
          banReason: user.banReason,
          banExpires: user.banExpires,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .leftJoin(segment, eq(segment.id, user.segmentId))
        .where(whereClause)
        .orderBy(orderByClause, direction(user.id))
        .limit(pagination.limit)
        .offset(pagination.offset),
    ]);

    const total = Number(totalResult[0]?.total ?? 0);

    if (rows.length === 0) {
      return { users: [], total };
    }

    const pageUserIds = rows.map((u) => u.id);

    const [accounts, sessions] = await Promise.all([
      db
        .select({ userId: account.userId, providerId: account.providerId })
        .from(account)
        .where(inArray(account.userId, pageUserIds)),
      db
        .select({ userId: session.userId, createdAt: session.createdAt })
        .from(session)
        .where(inArray(session.userId, pageUserIds)),
    ]);

    const accountMap = buildAccountMap(accounts);
    const lastSignInMap = buildLastSignInMap(sessions);

    const usersWithDetails: UserWithDetailsEntity[] = rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      emailVerified: u.emailVerified,
      role: u.role ?? null,
      segmentId: u.segmentId ?? null,
      segmentName: u.segmentName ?? null,
      segmentIcon: u.segmentIcon ?? null,
      banned: u.banned ?? false,
      banReason: u.banReason ?? null,
      banExpires: u.banExpires ?? null,
      image: u.image ?? null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      accounts: accountMap.get(u.id) ?? [],
      lastSignIn: lastSignInMap.get(u.id) ?? null,
    }));

    return {
      users: usersWithDetails,
      total,
    };
  },

  async findSelectOptions(
    filters: { q?: string; role?: string },
    pagination: { limit: number; offset: number },
  ): Promise<{ items: SelectUserItem[]; total: number }> {
    const clauses: SQL[] = [];

    if (filters.q?.trim()) {
      const term = `%${filters.q.trim()}%`;
      clauses.push(
        or(
          ilike(user.name, term),
          ilike(user.email, term),
          ilike(user.phone, term),
        )!,
      );
    }

    if (filters.role && filters.role !== "all") {
      clauses.push(eq(user.role, filters.role));
    }

    const whereClause = clauses.length > 0 ? and(...clauses) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          image: user.image,
          role: user.role,
        })
        .from(user)
        .where(whereClause)
        .orderBy(asc(user.name))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ total: count() }).from(user).where(whereClause),
    ]);

    return {
      items,
      total: totalResult[0]?.total ?? 0,
    };
  },

  async existsById(id: string): Promise<boolean> {
    const row = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    return row.length > 0;
  },

  async findIdsByRoles(roles: string[]): Promise<string[]> {
    if (roles.length === 0) {
      return [];
    }

    const rows = await db
      .select({ id: user.id })
      .from(user)
      .where(inArray(user.role, roles));

    return rows.map((row) => row.id);
  },

  async findRoleAndSegmentById(id: string): Promise<{
    role: string | null;
    segmentId: string | null;
  } | null> {
    const [row] = await db
      .select({
        role: user.role,
        segmentId: user.segmentId,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    return row ?? null;
  },

  /** Safe for public surfaces: display name and avatar only (no email). */
  async findPublicDisplayById(
    id: string,
  ): Promise<{ name: string; image: string | null } | null> {
    const [row] = await db
      .select({ name: user.name, image: user.image })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    return row ?? null;
  },

  async findById(id: string): Promise<UserWithDetailsEntity | null> {
    const result = await db.select().from(user).where(eq(user.id, id)).limit(1);

    if (!result[0]) {
      return null;
    }

    const u = result[0];

    const [accounts, sessions] = await Promise.all([
      db
        .select({ providerId: account.providerId })
        .from(account)
        .where(eq(account.userId, id)),
      db
        .select({ createdAt: session.createdAt })
        .from(session)
        .where(eq(session.userId, id)),
    ]);

    const [segmentRow] = await db
      .select({
        id: segment.id,
        name: segment.name,
        icon: segment.icon,
      })
      .from(segment)
      .where(eq(segment.id, u.segmentId ?? ""))
      .limit(1);

    const lastSignIn = sessions.reduce<Date | null>((latest, current) => {
      if (!latest || current.createdAt > latest) {
        return current.createdAt;
      }
      return latest;
    }, null);

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      emailVerified: u.emailVerified,
      role: u.role ?? null,
      segmentId: u.segmentId ?? null,
      segmentName: segmentRow?.name ?? null,
      segmentIcon: segmentRow?.icon ?? null,
      banned: u.banned ?? false,
      banReason: u.banReason ?? null,
      banExpires: u.banExpires ?? null,
      image: u.image ?? null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      accounts: accounts.map((a) => a.providerId),
      lastSignIn,
    };
  },

  async markEmailVerified(userId: string): Promise<void> {
    await db
      .update(user)
      .set({
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
  },

  async updateRoleById(userId: string, role: string): Promise<void> {
    await db
      .update(user)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
  },

  async updateRoleByEmail(email: string, role: string): Promise<void> {
    await db
      .update(user)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(user.email, email));
  },

  async updatePhoneById(userId: string, phone: string): Promise<void> {
    await db
      .update(user)
      .set({
        phone,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
  },

  async updateSegmentById(
    userId: string,
    segmentId: string | null,
  ): Promise<void> {
    await db
      .update(user)
      .set({
        segmentId,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
  },

  async deleteById(userId: string): Promise<void> {
    await db.delete(user).where(eq(user.id, userId));
  },
};
