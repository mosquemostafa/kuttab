import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { appSettings } from "@/server/modules/app-settings/app-settings.entity";

const DEFAULT_SETTINGS_ID = "default";

type AppSettingsRow = typeof appSettings.$inferSelect;

export const appSettingsRepository = {
  async findDefault(): Promise<AppSettingsRow | null> {
    const [settings] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.id, DEFAULT_SETTINGS_ID))
      .limit(1);

    return settings ?? null;
  },

  async createDefault(values: {
    organizationName: string;
    allowSelfRegistration: boolean;
    requireEmailVerification: boolean;
    sendSupportTicketConfirmationEmail: boolean;
    sendFeedbackConfirmationEmail: boolean;
    forceSingleActiveSession: boolean;
    sendNewsletterWelcomeEmail: boolean;
  }): Promise<AppSettingsRow | null> {
    const [created] = await db
      .insert(appSettings)
      .values({
        id: DEFAULT_SETTINGS_ID,
        ...values,
      })
      .onConflictDoNothing()
      .returning();

    return created ?? null;
  },

  async updateDefault(values: {
    organizationName: string;
    allowSelfRegistration: boolean;
    requireEmailVerification: boolean;
    sendSupportTicketConfirmationEmail: boolean;
    sendFeedbackConfirmationEmail: boolean;
    forceSingleActiveSession: boolean;
    sendNewsletterWelcomeEmail: boolean;
  }): Promise<void> {
    await db
      .update(appSettings)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(appSettings.id, DEFAULT_SETTINGS_ID));
  },
};
