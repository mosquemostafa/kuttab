"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  isApiClientError,
  formatValidationDetailsMessage,
} from "@/lib/api/api-error";

export function useApiErrorMessage() {
  const t = useTranslations("common.apiErrors");

  const translateCode = useCallback(
    (code: string): string | null => {
      switch (code) {
        case "UNAUTHORIZED":
          return t("UNAUTHORIZED");
        case "FORBIDDEN":
          return t("FORBIDDEN");
        case "SESSION_EXPIRED":
          return t("SESSION_EXPIRED");
        case "USER_NOT_FOUND":
          return t("USER_NOT_FOUND");
        case "EMAIL_ALREADY_EXISTS":
          return t("EMAIL_ALREADY_EXISTS");
        case "VALIDATION_ERROR":
          return t("VALIDATION_ERROR");
        case "INTERNAL_SERVER_ERROR":
          return t("INTERNAL_SERVER_ERROR");
        case "NOT_FOUND":
          return t("NOT_FOUND");
        case "NEWSLETTER_DISABLED":
          return t("NEWSLETTER_DISABLED");
        case "TOO_MANY_REQUESTS":
          return t("TOO_MANY_REQUESTS");
        case "PLAN_LIMIT_EXCEEDED":
          return t("PLAN_LIMIT_EXCEEDED");
        case "CONFLICT":
          return t("CONFLICT");
        case "TAG_ALREADY_EXISTS":
          return t("TAG_ALREADY_EXISTS");
        case "goal_already_completed":
          return t("goal_already_completed");
        case "goal_progress_exceeds_target":
          return t("goal_progress_exceeds_target");
        default:
          return null;
      }
    },
    [t],
  );

  return useCallback(
    (error: unknown, fallbackMessage?: string): string => {
      if (isApiClientError(error)) {
        if (error.code === "VALIDATION_ERROR" && error.details) {
          const detailsObj = error.details as Record<string, unknown>;
          if (
            typeof detailsObj === "object" &&
            detailsObj !== null &&
            "code" in detailsObj &&
            typeof detailsObj.code === "string"
          ) {
            const matched = translateCode(detailsObj.code);
            if (matched) {
              return matched;
            }
          }

          const detailsMsg = formatValidationDetailsMessage(error.details, "");
          if (detailsMsg) {
            return detailsMsg;
          }
        }

        const translated = translateCode(error.code);
        if (translated) {
          return translated;
        }

        if (
          error.message &&
          error.message.trim() &&
          error.message !== "Request failed"
        ) {
          return error.message;
        }

        return fallbackMessage || t("INTERNAL_SERVER_ERROR");
      }

      if (error instanceof Error && error.message.trim()) {
        return error.message;
      }

      return fallbackMessage || t("INTERNAL_SERVER_ERROR");
    },
    [t, translateCode],
  );
}
