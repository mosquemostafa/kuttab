import { requestNoStore } from "@/lib/api/api-core";
import type { LatenessDeductionDays } from "@/shared/types/teacher-attendance.types";

export const adminApi = {
  impersonateUser: async (userId: string) => {
    const res = await fetch(
      `/api/admin/users/${encodeURIComponent(userId)}/impersonate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      },
    );
    const payload = await res.json().catch(() => ({}));
    return { ok: res.ok, payload } as const;
  },
  getSettings: () =>
    requestNoStore<{
      organizationName: string;
      allowSelfRegistration: boolean;
      requireEmailVerification: boolean;
      sendSupportTicketConfirmationEmail: boolean;
      sendFeedbackConfirmationEmail: boolean;
      forceSingleActiveSession: boolean;
      sendNewsletterWelcomeEmail: boolean;
      workingDays: number[];
      latenessDeductionDays: LatenessDeductionDays;
    }>("/admin/settings"),
  updateSettings: (data: {
    organizationName?: string;
    allowSelfRegistration?: boolean;
    requireEmailVerification?: boolean;
    sendSupportTicketConfirmationEmail?: boolean;
    sendFeedbackConfirmationEmail?: boolean;
    forceSingleActiveSession?: boolean;
    sendNewsletterWelcomeEmail?: boolean;
    workingDays?: number[];
    latenessDeductionDays?: LatenessDeductionDays;
  }) =>
    requestNoStore<{
      organizationName: string;
      allowSelfRegistration: boolean;
      requireEmailVerification: boolean;
      sendSupportTicketConfirmationEmail: boolean;
      sendFeedbackConfirmationEmail: boolean;
      forceSingleActiveSession: boolean;
      sendNewsletterWelcomeEmail: boolean;
      workingDays: number[];
      latenessDeductionDays: LatenessDeductionDays;
    }>("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
