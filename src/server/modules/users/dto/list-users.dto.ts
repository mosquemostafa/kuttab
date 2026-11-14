import type { UserRole } from "@/shared/enums/user-role.enum";
import type { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";

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
  subscriptionPlan?: SubscriptionPlanEnum | "all";
  subscriptionStatus?: "active" | "inactive" | "all";
  subscriptionActivity?: "active" | "inactive" | "all";
}
