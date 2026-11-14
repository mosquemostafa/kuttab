import type { UserRole } from "@/shared/enums/user-role.enum";

export interface ListUsersQueryDTO {
  page?: number;
  limit?: number;
  sortBy?:
    | "name"
    | "email"
    | "phone"
    | "role"
    | "segmentId"
    | "createdAt"
    | "updatedAt";
  sortDirection?: "asc" | "desc";
  role?: UserRole;
  status?: "active" | "banned";
  email?: string;
  name?: string;
  phone?: string;
}
