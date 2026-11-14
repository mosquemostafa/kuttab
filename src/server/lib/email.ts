import nodemailer from "nodemailer";
import { env } from "@/server/lib/env";
import { routing } from "@/i18n/routing";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
});

const defaultFrom = `${env.GMAIL_FROM_NAME} <${env.GMAIL_FROM_EMAIL}>`;

type EmailLocale = (typeof routing.locales)[number];

const resolveEmailLocale = (locale?: string): EmailLocale => {
  if (locale === "ar" || locale === "en") {
    return locale;
  }

  return routing.defaultLocale as EmailLocale;
};

const getEmailLocaleMeta = (locale?: string) => {
  const resolvedLocale = resolveEmailLocale(locale);
  const isArabic = resolvedLocale === "ar";

  return {
    locale: resolvedLocale,
    dir: isArabic ? "rtl" : "ltr",
    textAlign: isArabic ? "right" : "left",
    isArabic,
  } as const;
};

export const sendEmail = async (payload: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) => {
  try {
    const response = await transporter.sendMail({
      from: defaultFrom,
      ...payload,
    });

    console.log("Email sent successfully:", response.messageId);

    return response.accepted.length > 0;
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    return false;
  }
};

export const getVerificationEmailTemplate = ({
  name,
  verificationUrl,
  locale,
}: {
  name?: string;
  verificationUrl: string;
  locale?: string;
}) => {
  const { locale: lang, dir, textAlign, isArabic } = getEmailLocaleMeta(locale);
  const safeName = name?.trim() || (isArabic ? "عزيزي المستخدم" : "there");

  const content = isArabic
    ? {
        title: "تأكيد بريدك الإلكتروني",
        badge: "مرحبًا",
        heading: "قم بتأكيد بريدك الإلكتروني",
        greeting: `مرحبًا ${safeName}،`,
        description:
          "شكرًا لتسجيلك. يرجى تأكيد بريدك الإلكتروني لتفعيل حسابك والبدء في استخدام جميع المزايا.",
        cta: "تأكيد البريد الإلكتروني",
        footer: "إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة بأمان.",
      }
    : {
        title: "Verify your email",
        badge: "Welcome",
        heading: "Confirm your email",
        greeting: `Hi ${safeName},`,
        description:
          "Thanks for signing up. Please verify your email address to activate your account and start using all features.",
        cta: "Verify my email",
        footer:
          "If you did not create this account, you can safely ignore this email.",
      };

  return `
  <!doctype html>
  <html lang="${lang}" dir="${dir}">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${content.title}</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;direction:${dir};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:28px 28px 8px;background:linear-gradient(135deg,#0ea5e9,#2563eb);">
                  <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#dbeafe;font-weight:700;text-align:${textAlign};">${content.badge}</p>
                  <h1 style="margin:8px 0 0;font-size:28px;line-height:1.2;color:#ffffff;text-align:${textAlign};">${content.heading}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#1e293b;text-align:${textAlign};">${content.greeting}</p>
                  <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#334155;text-align:${textAlign};">${content.description}</p>

                  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 22px;">
                    <tr>
                      <td>
                        <a href="${verificationUrl}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">${content.cta}</a>
                      </td>
                    </tr>
                  </table>

                  <div style="height:1px;background:#e2e8f0;margin:18px 0;"></div>

                  <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;text-align:${textAlign};">${content.footer}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};

export const getResetPasswordEmailTemplate = ({
  name,
  resetUrl,
  locale,
}: {
  name?: string;
  resetUrl: string;
  locale?: string;
}) => {
  const { locale: lang, dir, textAlign, isArabic } = getEmailLocaleMeta(locale);
  const safeName = name?.trim() || (isArabic ? "عزيزي المستخدم" : "there");

  const content = isArabic
    ? {
        title: "إعادة تعيين كلمة المرور",
        badge: "الأمان",
        heading: "أعد تعيين كلمة المرور",
        greeting: `مرحبًا ${safeName}،`,
        description:
          "تلقينا طلبًا لإعادة تعيين كلمة المرور. استخدم الزر أدناه لاختيار كلمة مرور جديدة. سينتهي هذا الرابط قريبًا.",
        cta: "إعادة تعيين كلمة المرور",
        footer: "إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان.",
      }
    : {
        title: "Reset your password",
        badge: "Security",
        heading: "Reset your password",
        greeting: `Hi ${safeName},`,
        description:
          "We received a request to reset your password. Use the button below to choose a new password. This link will expire soon.",
        cta: "Reset password",
        footer:
          "If you did not request this, you can safely ignore this email.",
      };

  return `
  <!doctype html>
  <html lang="${lang}" dir="${dir}">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${content.title}</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;direction:${dir};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:28px 28px 8px;background:linear-gradient(135deg,#ea580c,#f97316);">
                  <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#ffedd5;font-weight:700;text-align:${textAlign};">${content.badge}</p>
                  <h1 style="margin:8px 0 0;font-size:28px;line-height:1.2;color:#ffffff;text-align:${textAlign};">${content.heading}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#1e293b;text-align:${textAlign};">${content.greeting}</p>
                  <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#334155;text-align:${textAlign};">${content.description}</p>

                  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 22px;">
                    <tr>
                      <td>
                        <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#ea580c;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">${content.cta}</a>
                      </td>
                    </tr>
                  </table>

                  <div style="height:1px;background:#e2e8f0;margin:18px 0;"></div>

                  <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;text-align:${textAlign};">${content.footer}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};

export const getSupportTicketReceivedEmailTemplate = ({
  name,
  ticketId,
  subject,
  locale,
}: {
  name?: string;
  ticketId: string;
  subject: string;
  locale?: string;
}) => {
  const { locale: lang, dir, textAlign, isArabic } = getEmailLocaleMeta(locale);
  const safeName = name?.trim() || (isArabic ? "عزيزي المستخدم" : "there");

  const content = isArabic
    ? {
        title: "تم استلام تذكرة الدعم",
        badge: "الدعم",
        heading: "تم استلام تذكرتك",
        greeting: `مرحبًا ${safeName}،`,
        description:
          "شكرًا لتواصلك مع الدعم. لقد استلمنا طلبك وسيقوم فريقنا بالرد عليك قريبًا.",
        ticketIdLabel: "رقم التذكرة",
        subjectLabel: "الموضوع",
        footer: "يرجى الاحتفاظ بهذه الرسالة للرجوع إليها. نقدّر صبرك.",
      }
    : {
        title: "Support ticket received",
        badge: "Support",
        heading: "We received your ticket",
        greeting: `Hi ${safeName},`,
        description:
          "Thanks for contacting support. We received your request and our team will get back to you soon.",
        ticketIdLabel: "Ticket ID",
        subjectLabel: "Subject",
        footer:
          "Please keep this email for your records. We appreciate your patience.",
      };

  return `
  <!doctype html>
  <html lang="${lang}" dir="${dir}">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${content.title}</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;direction:${dir};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:28px 28px 8px;background:linear-gradient(135deg,#0f766e,#0d9488);">
                  <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#ccfbf1;font-weight:700;text-align:${textAlign};">${content.badge}</p>
                  <h1 style="margin:8px 0 0;font-size:28px;line-height:1.2;color:#ffffff;text-align:${textAlign};">${content.heading}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#1e293b;text-align:${textAlign};">${content.greeting}</p>
                  <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;text-align:${textAlign};">${content.description}</p>

                  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;">
                    <tr>
                      <td style="font-size:13px;line-height:1.7;color:#334155;text-align:${textAlign};">
                        <strong>${content.ticketIdLabel}:</strong> ${ticketId}<br />
                        <strong>${content.subjectLabel}:</strong> ${subject}
                      </td>
                    </tr>
                  </table>

                  <div style="height:1px;background:#e2e8f0;margin:18px 0;"></div>

                  <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;text-align:${textAlign};">${content.footer}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};

export const getFeedbackReceivedEmailTemplate = ({
  name,
  feedbackId,
  type,
  subject,
  locale,
}: {
  name?: string;
  feedbackId: string;
  type: "suggestion" | "complaint";
  subject: string;
  locale?: string;
}) => {
  const { locale: lang, dir, textAlign, isArabic } = getEmailLocaleMeta(locale);
  const safeName = name?.trim() || (isArabic ? "عزيزي المستخدم" : "there");
  const feedbackTypeLabel = isArabic
    ? type === "suggestion"
      ? "اقتراح"
      : "شكوى"
    : type === "suggestion"
      ? "suggestion"
      : "complaint";
  const feedbackTypeWithPossessive = isArabic
    ? type === "suggestion"
      ? "اقتراحك"
      : "شكواك"
    : `your ${feedbackTypeLabel}`;

  const content = isArabic
    ? {
        title: "تم استلام الملاحظة",
        badge: "الملاحظات",
        heading: `تم استلام ${feedbackTypeWithPossessive}`,
        greeting: `مرحبًا ${safeName}،`,
        description: `شكرًا على ${feedbackTypeWithPossessive}. لقد استلمناها وسيقوم فريقنا بمراجعتها قريبًا.`,
        feedbackIdLabel: "رقم الملاحظة",
        typeLabel: "النوع",
        subjectLabel: "الموضوع",
        footer: "يرجى الاحتفاظ بهذه الرسالة للرجوع إليها. نقدّر ملاحظاتك.",
      }
    : {
        title: "Feedback received",
        badge: "Feedback",
        heading: `We received ${feedbackTypeWithPossessive}`,
        greeting: `Hi ${safeName},`,
        description: `Thanks for sharing ${feedbackTypeWithPossessive}. We received it and our team will review it soon.`,
        feedbackIdLabel: "Feedback ID",
        typeLabel: "Type",
        subjectLabel: "Subject",
        footer:
          "Please keep this email for your records. We appreciate your feedback.",
      };

  return `
  <!doctype html>
  <html lang="${lang}" dir="${dir}">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${content.title}</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;direction:${dir};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:28px 28px 8px;background:linear-gradient(135deg,#1d4ed8,#2563eb);">
                  <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#dbeafe;font-weight:700;text-align:${textAlign};">${content.badge}</p>
                  <h1 style="margin:8px 0 0;font-size:28px;line-height:1.2;color:#ffffff;text-align:${textAlign};">${content.heading}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#1e293b;text-align:${textAlign};">${content.greeting}</p>
                  <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;text-align:${textAlign};">${content.description}</p>

                  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;">
                    <tr>
                      <td style="font-size:13px;line-height:1.7;color:#334155;text-align:${textAlign};">
                        <strong>${content.feedbackIdLabel}:</strong> ${feedbackId}<br />
                        <strong>${content.typeLabel}:</strong> ${feedbackTypeLabel}<br />
                        <strong>${content.subjectLabel}:</strong> ${subject}
                      </td>
                    </tr>
                  </table>

                  <div style="height:1px;background:#e2e8f0;margin:18px 0;"></div>

                  <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;text-align:${textAlign};">${content.footer}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};

interface SubscriptionEmailTemplateParams {
  name?: string;
  action:
    | "activated"
    | "extended"
    | "renewed"
    | "plan_changed"
    | "cancelled"
    | "trial_started";
  planName: string;
  expiresAt?: string;
  notes?: string | null;
  locale?: string;
  ctaUrl: string;
}

export const getSubscriptionNotificationEmailTemplate = ({
  name,
  action,
  planName,
  expiresAt,
  notes,
  locale,
  ctaUrl,
}: SubscriptionEmailTemplateParams) => {
  const { locale: lang, dir, textAlign, isArabic } = getEmailLocaleMeta(locale);
  const safeName = name?.trim() || (isArabic ? "عزيزي المستخدم" : "there");

  const actionContent = {
    activated: {
      title: isArabic ? "تم تفعيل اشتراكك بنجاح" : "Subscription Activated",
      heading: isArabic
        ? "تم تفعيل اشتراكك بنجاح 🎉"
        : "Subscription Activated 🎉",
      description: isArabic
        ? `يسعدنا إبلاغك بأنه تم تفعيل اشتراكك في باقة ${planName}. يمكنك الآن الوصول إلى جميع ميزات باقتك.`
        : `Your ${planName} subscription has been successfully activated. You now have full access to your plan features.`,
    },
    trial_started: {
      title: isArabic ? "بدأت فترتك التجريبية" : "Free Trial Started",
      heading: isArabic
        ? "مرحباً بك في الفترة التجريبية 🎁"
        : "Welcome to your Free Trial 🎁",
      description: isArabic
        ? `تم بدء فترتك التجريبية لباقة ${planName}. استمتع بجميع الميزات المتقدمة.`
        : `Your free trial for ${planName} has started. Explore all the features of the platform.`,
    },
    extended: {
      title: isArabic ? "تم تمديد اشتراكك" : "Subscription Extended",
      heading: isArabic ? "تم تمديد اشتراكك ⏳" : "Subscription Extended ⏳",
      description: isArabic
        ? `يسعدنا إبلاغك بأنه تم تمديد فترة اشتراكك في باقة ${planName}. شكراً لاستمرارك معنا.`
        : `Your ${planName} subscription period has been extended. Thank you for staying with us.`,
    },
    renewed: {
      title: isArabic ? "تم تجديد اشتراكك" : "Subscription Renewed",
      heading: isArabic
        ? "تم تجديد اشتراكك بنجاح 🔄"
        : "Subscription Renewed 🔄",
      description: isArabic
        ? `تم تجديد اشتراكك في باقة ${planName}. شكراً لثقتك واستمرارك معنا.`
        : `Your ${planName} subscription has been renewed. Thank you for continuing with our platform.`,
    },
    plan_changed: {
      title: isArabic ? "تم تغيير خطة اشتراكك" : "Subscription Plan Updated",
      heading: isArabic
        ? "تم تغيير خطة اشتراكك 💎"
        : "Subscription Plan Updated 💎",
      description: isArabic
        ? `تم تحديث خطة اشتراكك إلى باقة ${planName}. استمتع بالميزات الجديدة المتاحة لحسابك.`
        : `Your subscription has been updated to the ${planName} plan. Enjoy your new features.`,
    },
    cancelled: {
      title: isArabic ? "تم إلغاء اشتراكك" : "Subscription Cancelled",
      heading: isArabic ? "تم إلغاء اشتراكك ℹ️" : "Subscription Cancelled ℹ️",
      description: isArabic
        ? `تم إلغاء اشتراكك في باقة ${planName}. نأمل أن نراك معنا مجدداً في المستقبل.`
        : `Your ${planName} subscription has been cancelled. We hope to see you back soon.`,
    },
  }[action];

  const content = {
    ...actionContent,
    badge: isArabic ? "الاشتراكات" : "Subscription",
    greeting: isArabic ? `مرحبًا ${safeName}،` : `Hi ${safeName},`,
    planLabel: isArabic ? "الخطة" : "Plan",
    expiresLabel: isArabic ? "تاريخ الانتهاء" : "Valid Until",
    notesLabel: isArabic ? "ملاحظات" : "Notes",
    cta: isArabic ? "عرض تفاصيل الاشتراك" : "View Subscription",
    footer: isArabic
      ? "إذا كانت لديك أي استفسارات بخصوص اشتراكك، يمكنك التواصل مع فريق الدعم."
      : "If you have any questions regarding your subscription, please reach out to our support team.",
  };

  return `
  <!doctype html>
  <html lang="${lang}" dir="${dir}">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${content.title}</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;direction:${dir};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:28px 28px 8px;background:linear-gradient(135deg,#1d4ed8,#2563eb);">
                  <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#dbeafe;font-weight:700;text-align:${textAlign};">${content.badge}</p>
                  <h1 style="margin:8px 0 0;font-size:26px;line-height:1.2;color:#ffffff;text-align:${textAlign};">${content.heading}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#1e293b;text-align:${textAlign};">${content.greeting}</p>
                  <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;text-align:${textAlign};">${content.description}</p>

                  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;width:100%;">
                    <tr>
                      <td style="font-size:13px;line-height:1.8;color:#334155;text-align:${textAlign};">
                        <strong>${content.planLabel}:</strong> ${planName}<br />
                        ${expiresAt ? `<strong>${content.expiresLabel}:</strong> ${expiresAt}<br />` : ""}
                        ${notes ? `<strong>${content.notesLabel}:</strong> ${notes}` : ""}
                      </td>
                    </tr>
                  </table>

                  <div style="text-align:${textAlign};margin:24px 0 18px;">
                    <a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:8px;">
                      ${content.cta}
                    </a>
                  </div>

                  <div style="height:1px;background:#e2e8f0;margin:18px 0;"></div>

                  <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;text-align:${textAlign};">${content.footer}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};
