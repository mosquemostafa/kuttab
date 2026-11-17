import {
  appSettingsCacheKey,
  invalidateAppSettingsCache,
} from "@/server/modules/app-settings/app-settings.cache";
import { appSettingsRepository } from "@/server/modules/app-settings/app-settings.repository";
import { getCacheTtlSeconds } from "@/server/modules/cache/cache-ttl";
import { cacheGetOrSet } from "@/server/modules/cache/cache.service";
import {
  LatenessPeriod,
  type LatenessDeductionDays,
} from "@/shared/types/teacher-attendance.types";

type AppSettings = {
  organizationName: string;
  allowSelfRegistration: boolean;
  requireEmailVerification: boolean;
  sendSupportTicketConfirmationEmail: boolean;
  sendFeedbackConfirmationEmail: boolean;
  forceSingleActiveSession: boolean;
  sendNewsletterWelcomeEmail: boolean;
  workingDays: number[];
  latenessDeductionDays: LatenessDeductionDays;
};

const DEFAULT_LATENESS_DEDUCTION_DAYS: LatenessDeductionDays = {
  [LatenessPeriod.FROM_35_TO_45_MIN]: 0,
  [LatenessPeriod.FROM_45_TO_60_MIN]: 0,
  [LatenessPeriod.MORE_THAN_60_MIN]: 0,
};

const DEFAULT_SETTINGS: AppSettings = {
  organizationName: "my-project",
  allowSelfRegistration: true,
  requireEmailVerification: true,
  sendSupportTicketConfirmationEmail: true,
  sendFeedbackConfirmationEmail: true,
  forceSingleActiveSession: false,
  sendNewsletterWelcomeEmail: false,
  workingDays: [0, 1, 2, 3, 4],
  latenessDeductionDays: DEFAULT_LATENESS_DEDUCTION_DAYS,
};

function isMissingRelationError(error: unknown) {
  const code = (error as { code?: string })?.code;
  const causeCode = (error as { cause?: { code?: string } })?.cause?.code;
  return code === "42P01" || causeCode === "42P01";
}

async function loadAppSettingsFromDatabase(): Promise<AppSettings> {
  const existing = await appSettingsRepository.findDefault();
  if (existing) {
    return toSettings(existing);
  }

  const created = await appSettingsRepository.createDefault(DEFAULT_SETTINGS);
  if (created) {
    return toSettings(created);
  }

  const fallback = await appSettingsRepository.findDefault();
  return toSettings(fallback ?? DEFAULT_SETTINGS);
}

function toSettings(values: Partial<AppSettings>): AppSettings {
  return {
    organizationName:
      values.organizationName ?? DEFAULT_SETTINGS.organizationName,
    allowSelfRegistration:
      values.allowSelfRegistration ?? DEFAULT_SETTINGS.allowSelfRegistration,
    requireEmailVerification:
      values.requireEmailVerification ??
      DEFAULT_SETTINGS.requireEmailVerification,
    sendSupportTicketConfirmationEmail:
      values.sendSupportTicketConfirmationEmail ??
      DEFAULT_SETTINGS.sendSupportTicketConfirmationEmail,
    sendFeedbackConfirmationEmail:
      values.sendFeedbackConfirmationEmail ??
      DEFAULT_SETTINGS.sendFeedbackConfirmationEmail,
    forceSingleActiveSession:
      values.forceSingleActiveSession ??
      DEFAULT_SETTINGS.forceSingleActiveSession,
    sendNewsletterWelcomeEmail:
      values.sendNewsletterWelcomeEmail ??
      DEFAULT_SETTINGS.sendNewsletterWelcomeEmail,
    workingDays:
      values.workingDays && Array.isArray(values.workingDays)
        ? values.workingDays
        : DEFAULT_SETTINGS.workingDays,
    latenessDeductionDays: values.latenessDeductionDays
      ? {
          ...DEFAULT_LATENESS_DEDUCTION_DAYS,
          ...values.latenessDeductionDays,
        }
      : DEFAULT_LATENESS_DEDUCTION_DAYS,
  };
}

export const appSettingsService = {
  async getSettings(): Promise<AppSettings> {
    try {
      return await cacheGetOrSet(
        appSettingsCacheKey(),
        getCacheTtlSeconds("appSettings"),
        loadAppSettingsFromDatabase,
        { debugLabel: "app-settings" },
      );
    } catch (error) {
      if (isMissingRelationError(error)) {
        return DEFAULT_SETTINGS;
      }

      throw error;
    }
  },

  async updateSettings(values: Partial<AppSettings>): Promise<AppSettings> {
    try {
      const current = await this.getSettings();
      const next: AppSettings = {
        organizationName:
          values.organizationName?.trim() || current.organizationName,
        allowSelfRegistration:
          values.allowSelfRegistration ?? current.allowSelfRegistration,
        requireEmailVerification:
          values.requireEmailVerification ?? current.requireEmailVerification,
        sendSupportTicketConfirmationEmail:
          values.sendSupportTicketConfirmationEmail ??
          current.sendSupportTicketConfirmationEmail,
        sendFeedbackConfirmationEmail:
          values.sendFeedbackConfirmationEmail ??
          current.sendFeedbackConfirmationEmail,
        forceSingleActiveSession:
          values.forceSingleActiveSession ?? current.forceSingleActiveSession,
        sendNewsletterWelcomeEmail:
          values.sendNewsletterWelcomeEmail ??
          current.sendNewsletterWelcomeEmail,
        workingDays:
          values.workingDays && Array.isArray(values.workingDays)
            ? values.workingDays
            : current.workingDays,
        latenessDeductionDays:
          values.latenessDeductionDays ?? current.latenessDeductionDays,
      };

      await appSettingsRepository.updateDefault(next);
      await invalidateAppSettingsCache();
      return next;
    } catch (error) {
      if (isMissingRelationError(error)) {
        throw new Error(
          "The app_settings table is missing. Run database migrations and try again.",
        );
      }

      throw error;
    }
  },
};
