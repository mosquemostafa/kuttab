import type { SupportStaffOverviewDTO } from "@/shared/types/support-staff-overview.types";
import { requestNoStore } from "@/lib/api/api-core";

export const supportStaffApi = {
  overview: () =>
    requestNoStore<SupportStaffOverviewDTO>("/support/staff/overview"),
};
