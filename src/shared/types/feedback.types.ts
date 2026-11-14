import type { FeedbackStatus } from "@/shared/enums/feedback-status.enum";
import type { FeedbackType } from "@/shared/enums/feedback-type.enum";

export interface FeedbackDTO {
  id: string;
  userId: string;
  userEmail?: string | null;
  type: FeedbackType;
  subject: string;
  description: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
}
