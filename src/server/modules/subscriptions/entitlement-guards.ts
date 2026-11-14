import { PlanLimitExceededException } from "@/server/exceptions/exceptions";
import { projectRepository } from "@/server/modules/projects/project.repository";
import { todoRepository } from "@/server/modules/todos/todo.repository";
import { subscriptionService } from "@/server/modules/subscriptions/subscription.service";
import { userMediaRepository } from "@/server/modules/user-media/user-media.repository";
import { USER_MEDIA_USAGE_TYPE } from "@/shared/constants/user-media.constants";

/**
 * Enforces `PlanFeatures.maxEditorImages` (total uploaded editor images per user).
 */
export async function assertCanAddEditorImage(userId: string): Promise<void> {
  const { features } = await subscriptionService.getEntitlements(userId);
  const max = features.maxEditorImages;
  if (max == null) {
    return;
  }

  const count = await userMediaRepository.countByUploadedByAndUsageType(
    userId,
    USER_MEDIA_USAGE_TYPE.EDITOR_IMAGE,
  );
  if (count >= max) {
    throw new PlanLimitExceededException("editor_images", max);
  }
}

/** Enforces `PlanFeatures.maxProjects` (total projects per user). */
export async function assertCanCreateProject(userId: string): Promise<void> {
  const { features } = await subscriptionService.getEntitlements(userId);
  const max = features.maxProjects;
  if (max == null) {
    return;
  }

  const count = await projectRepository.countByUserId(userId, {});
  if (count >= max) {
    throw new PlanLimitExceededException("projects", max);
  }
}

/** Enforces `PlanFeatures.maxTodos` (total todos per user). */
export async function assertCanCreateTodo(userId: string): Promise<void> {
  const { features } = await subscriptionService.getEntitlements(userId);
  const max = features.maxTodos;
  if (max == null) {
    return;
  }

  const count = await todoRepository.countByUserId(userId);
  if (count >= max) {
    throw new PlanLimitExceededException("todos", max);
  }
}
