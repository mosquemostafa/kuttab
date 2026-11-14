import {
  getFeedbackReceivedEmailTemplate,
  sendEmail,
} from "@/server/lib/email";
import { appSettingsService } from "@/server/modules/app-settings/app-settings.service";
import {
  ForbiddenException,
  NotFoundException,
} from "@/server/exceptions/exceptions";
import { feedbackRepository } from "@/server/modules/feedbacks/feedback.repository";
import { notificationService } from "@/server/modules/notifications/notification.service";
import type {
  CreateFeedbackDTO,
  ListFeedbacksQueryDTO,
} from "@/server/modules/feedbacks/feedback.dto";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import { FeedbackStatus } from "@/shared/enums/feedback-status.enum";
import { FeedbackType } from "@/shared/enums/feedback-type.enum";
import { UserRole } from "@/shared/enums/user-role.enum";
import type { PaginatedResponse } from "@/shared/types/pagination.types";
import type { FeedbackDTO } from "@/shared/types/feedback.types";
import { userRepository } from "@/server/modules/users/user.repository";

type FeedbackRow =
  Awaited<ReturnType<typeof feedbackRepository.findById>> extends infer T
    ? NonNullable<T>
    : never;

function toDTO(item: FeedbackRow): FeedbackDTO {
  return {
    id: item.id,
    userId: item.userId,
    userEmail:
      "userEmail" in item
        ? ((item as FeedbackRow & { userEmail?: string | null }).userEmail ??
          null)
        : null,
    type: item.type as FeedbackType,
    subject: item.subject,
    description: item.description,
    status: item.status as FeedbackStatus,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function isSupportStaff(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPPORT;
}

export const feedbackService = {
  async listMyFeedbacks(
    userId: string,
    pagination: ParsedPagination,
    filters: Pick<ListFeedbacksQueryDTO, "status" | "type" | "sortDirection">,
  ): Promise<PaginatedResponse<FeedbackDTO>> {
    const result = await feedbackRepository.findManyByUserId(
      userId,
      pagination,
      {
        status: filters.status,
        type: filters.type,
      },
      filters.sortDirection,
    );

    return {
      items: result.items.map(toDTO),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit),
      },
    };
  },

  async listAllFeedbacks(
    pagination: ParsedPagination,
    filters: Pick<ListFeedbacksQueryDTO, "status" | "type" | "sortDirection">,
  ): Promise<PaginatedResponse<FeedbackDTO>> {
    const result = await feedbackRepository.findMany(
      pagination,
      {
        status: filters.status,
        type: filters.type,
      },
      filters.sortDirection,
    );

    return {
      items: result.items.map(toDTO),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit),
      },
    };
  },

  async getFeedbackById(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<FeedbackDTO> {
    const item = isSupportStaff(role)
      ? await feedbackRepository.findById(id)
      : await feedbackRepository.findByIdAndUserId(id, userId);

    if (!item) {
      throw new NotFoundException("Feedback", id);
    }

    return toDTO(item);
  },

  async createFeedback(
    userId: string,
    input: CreateFeedbackDTO,
    locale?: string,
  ): Promise<FeedbackDTO> {
    const created = await feedbackRepository.create({
      userId,
      type: input.type,
      subject: input.subject,
      description: input.description,
    });

    // Feedback creation should succeed even if notification email fails.
    const [settings, profile] = await Promise.all([
      appSettingsService.getSettings(),
      userRepository.findProfileById(userId),
    ]);

    if (settings.sendFeedbackConfirmationEmail && profile?.email) {
      const isArabic = locale === "ar";
      const localizedTypeWithPossessive = isArabic
        ? created.type === FeedbackType.SUGGESTION
          ? "اقتراحك"
          : "شكواك"
        : `your ${created.type}`;

      void sendEmail({
        to: profile.email,
        subject: isArabic
          ? `تم استلام الملاحظة: ${created.subject}`
          : `Feedback received: ${created.subject}`,
        text: isArabic
          ? `مرحبًا ${profile.name || "عزيزي المستخدم"},\n\nلقد استلمنا ${localizedTypeWithPossessive} وسنقوم بمراجعتها قريبًا.\n\nرقم الملاحظة: ${created.id}\nالموضوع: ${created.subject}`
          : `Hi ${profile.name || "there"},\n\nWe received ${localizedTypeWithPossessive} and will review it soon.\n\nFeedback ID: ${created.id}\nSubject: ${created.subject}`,
        html: getFeedbackReceivedEmailTemplate({
          name: profile.name,
          feedbackId: created.id,
          type: created.type as FeedbackType,
          subject: created.subject,
          locale,
        }),
      });
    }

    // Notify support staff about the new feedback. Fire-and-forget so
    // feedback creation never fails because of notification dispatch.
    void (async () => {
      try {
        const staffIds = await userRepository.findIdsByRoles([
          UserRole.ADMIN,
          UserRole.SUPPORT,
        ]);

        const isArabic = locale === "ar";
        await notificationService.createForUsers(staffIds, {
          type: "feedback",
          title: isArabic ? "ملاحظة جديدة" : "New feedback",
          message: isArabic
            ? `تم استلام ملاحظة جديدة: ${created.subject}`
            : `New feedback was received: ${created.subject}`,
          link: "/support/feedbacks",
          metadata: {
            feedbackId: created.id,
            subject: created.subject,
            feedbackType: created.type as FeedbackType,
          },
        });
      } catch {
        // Notification dispatch must not affect feedback creation.
      }
    })();

    return toDTO(created);
  },

  async updateFeedbackStatus(
    id: string,
    role: UserRole,
    status: FeedbackStatus,
  ): Promise<FeedbackDTO> {
    if (!isSupportStaff(role)) {
      throw new ForbiddenException();
    }

    const updated = await feedbackRepository.updateStatus(id, status);

    if (!updated) {
      throw new NotFoundException("Feedback", id);
    }

    return toDTO(updated);
  },

  async deleteFeedback(id: string, role: UserRole): Promise<void> {
    if (!isSupportStaff(role)) {
      throw new ForbiddenException();
    }

    const deleted = await feedbackRepository.delete(id);

    if (!deleted) {
      throw new NotFoundException("Feedback", id);
    }
  },
};
