import { eq } from "drizzle-orm";

import { env } from "@/server/lib/env";
import {
  getSubscriptionNotificationEmailTemplate,
  sendEmail,
} from "@/server/lib/email";
import { db } from "@/server/db";
import { user } from "@/server/modules/users/user.entity";
import { fcmService } from "@/server/modules/fcm/fcm.service";
import { notificationService } from "@/server/modules/notifications/notification.service";
import { PLAN_CONFIG } from "@/server/modules/subscriptions/subscription-entitlements";
import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";

type SubscriptionNotificationAction =
  | "activated"
  | "extended"
  | "renewed"
  | "plan_changed"
  | "cancelled"
  | "trial_started";

interface NotifySubscriptionChangeParams {
  userId: string;
  action: SubscriptionNotificationAction;
  plan: SubscriptionPlanEnum;
  expiresAt?: Date | null;
  notes?: string | null;
}

export const subscriptionNotifierService = {
  async notifySubscriptionChange(
    params: NotifySubscriptionChangeParams,
  ): Promise<void> {
    const { userId, action, plan, expiresAt, notes } = params;

    try {
      // 1. Fetch user details (name, email)
      const [targetUser] = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!targetUser) {
        console.warn(
          `[subscriptionNotifier] User not found for userId=${userId}, skipping notifications.`,
        );
        return;
      }

      // 2. Prepare plan display information
      const planConfig = PLAN_CONFIG[plan];
      const planNameAr = planConfig?.displayName?.ar ?? plan;
      const formattedDateAr = expiresAt
        ? new Intl.DateTimeFormat("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(expiresAt)
        : undefined;

      // 3. Build action-specific in-app & push notification copy (Arabic default)
      const actionMessages = {
        activated: {
          title: "تم تفعيل اشتراكك بنجاح 🎉",
          message: `تم تفعيل اشتراكك في باقة ${planNameAr}.${formattedDateAr ? ` صالح حتى ${formattedDateAr}.` : ""} استمتع بجميع الميزات المتقدمة!`,
        },
        trial_started: {
          title: "بدأت فترتك التجريبية 🎁",
          message: `تم تفعيل تجربتك المجانية لباقة ${planNameAr}.${formattedDateAr ? ` صالحة حتى ${formattedDateAr}.` : ""} ابدأ الآن واستكشف إمكانيات مداوم.`,
        },
        extended: {
          title: "تم تمديد اشتراكك ⏳",
          message: `تم تمديد اشتراكك في باقة ${planNameAr}${formattedDateAr ? ` حتى ${formattedDateAr}` : ""}. شكراً لثقتك بنا!`,
        },
        renewed: {
          title: "تم تجديد اشتراكك 🔄",
          message: `تم تجديد اشتراكك في باقة ${planNameAr}${formattedDateAr ? ` حتى ${formattedDateAr}` : ""}. واصل بناء عاداتك وإنجازاتك.`,
        },
        plan_changed: {
          title: "تم تغيير خطة اشتراكك 💎",
          message: `تم تحديث خطة اشتراكك إلى باقة ${planNameAr}${formattedDateAr ? ` حتى ${formattedDateAr}` : ""}.`,
        },
        cancelled: {
          title: "تم إلغاء اشتراكك ℹ️",
          message: `تم إلغاء اشتراكك في باقة ${planNameAr}. نأمل أن نراك مجدداً معنا قريباً.`,
        },
      }[action];

      const billingUrl = "/dashboard/settings/billing";
      const fullBillingUrl = `${env.NEXT_PUBLIC_APP_URL || ""}${billingUrl}`;

      // 4. Dispatch simultaneously across In-App, FCM Push, and Email
      await Promise.allSettled([
        // Channel A: In-App Notification (PostgreSQL)
        notificationService
          .createForUser(userId, {
            type: "subscription",
            title: actionMessages.title,
            message: actionMessages.message,
            link: billingUrl,
            metadata: {
              action,
              plan,
            },
          })
          .catch((err) => {
            console.error(
              `[subscriptionNotifier] In-app notification failed for user ${userId}:`,
              err,
            );
          }),

        // Channel B: FCM Push Notification (Firebase)
        fcmService
          .sendToUser({
            userId,
            payload: {
              title: actionMessages.title,
              body: actionMessages.message,
              url: billingUrl,
              data: {
                type: "subscription",
                action,
                plan,
                link: billingUrl,
              },
            },
          })
          .catch((err) => {
            console.error(
              `[subscriptionNotifier] FCM push notification failed for user ${userId}:`,
              err,
            );
          }),

        // Channel C: Transactional Email (Nodemailer)
        (async () => {
          if (!targetUser.email) return;

          const emailHtml = getSubscriptionNotificationEmailTemplate({
            name: targetUser.name,
            action,
            planName: planNameAr,
            expiresAt: formattedDateAr,
            notes,
            locale: "ar",
            ctaUrl: fullBillingUrl,
          });

          await sendEmail({
            to: targetUser.email,
            subject: actionMessages.title,
            text: `${actionMessages.title}\n\n${actionMessages.message}`,
            html: emailHtml,
          });
        })().catch((err) => {
          console.error(
            `[subscriptionNotifier] Email delivery failed for user ${userId} (${targetUser.email}):`,
            err,
          );
        }),
      ]);
    } catch (error) {
      console.error(
        `[subscriptionNotifier] Unexpected error notifying user ${userId} of ${action}:`,
        error,
      );
    }
  },
};
