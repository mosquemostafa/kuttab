import { createId } from "@paralleldrive/cuid2";
import { eq, inArray } from "drizzle-orm";

import { db } from "@/server/db";
import {
  announcement,
  appSettings,
  feedback,
  newsletterCampaign,
  newsletterCampaignSend,
  newsletterSubscriber,
  notification,
  segment,
  supportTicket,
  user,
  usersAnnouncement,
} from "@/server/db/schema";
import { ForbiddenException } from "@/server/exceptions/exceptions";
import { env } from "@/server/lib/env";
import { AnnouncementType } from "@/shared/enums/announcement-type.enum";

import type { SeedInputDTO, SeedResultDTO } from "./seed.dto";

export function isLocalDatabase(dbUrl: string): boolean {
  if (!dbUrl) return false;
  if (process.env.NODE_ENV === "production") return false;

  const prodUrl = process.env.DATABASE_URL_PROD?.trim();
  if (prodUrl && dbUrl.trim() === prodUrl) {
    return false;
  }

  return true;
}

export function assertLocalDatabaseAllowed() {
  if (process.env.NODE_ENV === "production") {
    throw new ForbiddenException(
      "Database seeding is strictly forbidden in production environments (NODE_ENV=production).",
    );
  }

  const prodUrl = process.env.DATABASE_URL_PROD?.trim();
  const currentUrl = (
    process.env.DATABASE_URL ||
    env.DATABASE_URL ||
    ""
  ).trim();

  if (prodUrl && currentUrl && prodUrl === currentUrl) {
    throw new ForbiddenException(
      "Database seeding is strictly forbidden on production database (DATABASE_URL matches DATABASE_URL_PROD).",
    );
  }
}

export const seedService = {
  async seed(dto: SeedInputDTO = {}): Promise<SeedResultDTO> {
    assertLocalDatabaseAllowed();

    // Fresh relative date helpers computed at the exact moment of invocation
    const now = new Date();
    const daysAgo = (n: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - n);
      return d;
    };
    const daysAhead = (n: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + n);
      return d;
    };

    const summary: Record<string, number> = {};
    const track = (key: string, count: number) => {
      summary[key] = (summary[key] || 0) + count;
    };

    // ─── 1. App Settings ─────────────────────────────────────────────────────
    const existingSettings = await db.select().from(appSettings).limit(1);
    if (existingSettings.length === 0) {
      await db.insert(appSettings).values({
        id: "default",
        organizationName: "Almostafa",
        allowSelfRegistration: true,
        requireEmailVerification: true,
        sendSupportTicketConfirmationEmail: true,
        sendFeedbackConfirmationEmail: true,
        forceSingleActiveSession: false,
        sendNewsletterWelcomeEmail: true,
      });
      track("appSettings", 1);
    }

    // ─── 2. User Segments ────────────────────────────────────────────────────
    const defaultSegments = [
      { id: "seg_power_user", name: "Power User", icon: "Sparkles" },
      { id: "seg_developer", name: "Developer", icon: "Code" },
      { id: "seg_student", name: "Student", icon: "GraduationCap" },
      { id: "seg_creator", name: "Creator", icon: "Palette" },
      { id: "seg_early_adopter", name: "Early Adopter", icon: "Rocket" },
    ];

    for (const seg of defaultSegments) {
      await db
        .insert(segment)
        .values({
          id: seg.id,
          name: seg.name,
          icon: seg.icon,
        })
        .onConflictDoNothing();
    }
    track("segments", defaultSegments.length);

    // ─── 3. Identify / Ensure Primary Target User ─────────────────────────────
    let primaryUserId = dto.targetUserId;
    if (!primaryUserId) {
      // Find first user in database or create default
      const [firstUser] = await db.select().from(user).limit(1);
      if (firstUser) {
        primaryUserId = firstUser.id;
      } else {
        primaryUserId = "usr_primary_admin";
      }
    }

    const [existingPrimary] = await db
      .select()
      .from(user)
      .where(eq(user.id, primaryUserId))
      .limit(1);

    if (existingPrimary) {
      await db
        .update(user)
        .set({
          role: "admin",
          emailVerified: true,
          isPublicKnowledgeProfile: true,
          knowledgeBio:
            "Building consistent daily habits, lifelong learning, and mastering software engineering.",
          segmentId: "seg_power_user",
          updatedAt: new Date(),
        })
        .where(eq(user.id, primaryUserId));
      track("primaryUserUpdated", 1);
    } else {
      await db.insert(user).values({
        id: primaryUserId,
        name: "Abdelrahman Nassar",
        email: "abdelrhman.ahmed.nassar@gmail.com",
        role: "admin",
        phone: "01000000000",
        emailVerified: true,
        isPublicKnowledgeProfile: true,
        knowledgeBio:
          "Building consistent daily habits, lifelong learning, and mastering software engineering.",
        segmentId: "seg_power_user",
        createdAt: daysAgo(60),
        updatedAt: new Date(),
      });
      track("primaryUserCreated", 1);
    }

    // ─── 4. Secondary Users (For Admin Analytics, Overview & Multi-User UX) ──
    const secondaryUsers = [
      {
        id: "usr_sarah_jenkins",
        name: "Sarah Jenkins",
        email: "sarah.j@example.com",
        role: "user",
        segmentId: "seg_developer",
        createdAt: daysAgo(45),
      },
      {
        id: "usr_karim_mansour",
        name: "Karim Mansour",
        email: "karim.m@example.com",
        role: "user",
        segmentId: "seg_student",
        createdAt: daysAgo(35),
      },
      {
        id: "usr_layla_ahmed",
        name: "Layla Ahmed",
        email: "layla.a@example.com",
        role: "user",
        segmentId: "seg_power_user",
        createdAt: daysAgo(30),
      },
      {
        id: "usr_omar_farooq",
        name: "Omar Farooq",
        email: "omar.f@example.com",
        role: "user",
        segmentId: "seg_early_adopter",
        createdAt: daysAgo(25),
      },
      {
        id: "usr_nour_eldin",
        name: "Nour El-Din",
        email: "nour.e@example.com",
        role: "support",
        segmentId: "seg_creator",
        createdAt: daysAgo(20),
      },
      {
        id: "usr_ziad_hassan",
        name: "Ziad Hassan",
        email: "ziad.h@example.com",
        role: "user",
        segmentId: "seg_student",
        createdAt: daysAgo(10),
      },
    ];

    for (const u of secondaryUsers) {
      await db
        .insert(user)
        .values({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          segmentId: u.segmentId,
          phone: "01011112222",
          emailVerified: true,
          createdAt: u.createdAt,
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
    }
    track("secondaryUsers", secondaryUsers.length);

    // ─── 5. Cleanup for Idempotent & Fresh Relative Date Seeding ──────────────
    const shouldClean = dto.cleanBeforeSeed !== false;
    if (shouldClean) {
      // 1. Clean primary user personal records
      await db
        .delete(notification)
        .where(eq(notification.userId, primaryUserId));
      await db
        .delete(supportTicket)
        .where(eq(supportTicket.userId, primaryUserId));
      await db.delete(feedback).where(eq(feedback.userId, primaryUserId));
      await db
        .delete(usersAnnouncement)
        .where(eq(usersAnnouncement.userId, primaryUserId));

      // 2. Clean secondary users data so multi-user analytics & tickets refresh with fresh dates
      const secondaryUserIds = secondaryUsers.map((u) => u.id);
      await db
        .delete(supportTicket)
        .where(inArray(supportTicket.userId, secondaryUserIds));
      await db
        .delete(feedback)
        .where(inArray(feedback.userId, secondaryUserIds));

      // 3. Clean system-level seed items so their publishedAt / startsAt dates are refreshed to today
      await db
        .delete(announcement)
        .where(
          inArray(announcement.id, [
            "ann_v2_release",
            "ann_maintenance",
            "ann_pro_exclusive",
          ]),
        );
      await db
        .delete(newsletterCampaign)
        .where(eq(newsletterCampaign.id, "cmp_monthly_digest"));
      await db
        .delete(newsletterSubscriber)
        .where(
          inArray(newsletterSubscriber.email, [
            "subscriber.layla@example.com",
            "subscriber.ahmed@example.com",
            "subscriber.ziad@example.com",
            "subscriber.sarah@example.com",
            "subscriber.unsub@example.com",
          ]),
        );
    }

    // ─── 22. Notifications ───────────────────────────────────────────────────
    const primaryNotifications = [
      {
        id: `notif_${primaryUserId}_streak_achievement`,
        userId: primaryUserId,
        type: "streak_achievement",
        title: "21-Day Habit Streak Achieved! 🔥",
        message:
          "Incredible consistency! You have completed 'Evening Daily Journal' 21 days in a row.",
        link: "/dashboard/habits",
        isRead: false,
        createdAt: daysAgo(1),
      },
      {
        id: `notif_${primaryUserId}_reading_reminder`,
        userId: primaryUserId,
        type: "habit_reminder",
        title: "Time for 30-Min Daily Reading",
        message:
          "Your afternoon reading habit is scheduled. Take 30 minutes to expand your mind.",
        link: "/dashboard/habits",
        isRead: false,
        createdAt: daysAgo(2),
      },
      {
        id: `notif_${primaryUserId}_v2_release`,
        userId: primaryUserId,
        type: "system",
        title: "Almostafa Platform Update Released",
        message:
          "Explore enhanced analytics, dark mode, and full Arabic RTL support.",
        link: "/dashboard/overview",
        isRead: true,
        createdAt: daysAgo(7),
      },
    ];

    for (const n of primaryNotifications) {
      await db.insert(notification).values(n).onConflictDoNothing();
    }
    track("notifications", primaryNotifications.length);

    // ─── 23. Support Tickets & Feedbacks (Admin & Support Overviews) ──────────
    const supportTicketsList = [
      {
        id: `stk_${primaryUserId}_audio`,
        userId: primaryUserId,
        subject: "Audio feedback on habit completion",
        description:
          "It would be great to have a subtle audio chime when completing a habit on the dashboard.",
        status: "resolved" as const,
        createdAt: daysAgo(10),
      },
      {
        id: `stk_sarah_yt`,
        userId: "usr_sarah_jenkins",
        subject: "Importing large YouTube playlist question",
        description:
          "Does the video playlist importer support playlists with more than 50 video lessons?",
        status: "open" as const,
        createdAt: daysAgo(1),
      },
      {
        id: `stk_karim_receipt`,
        userId: "usr_karim_mansour",
        subject: "Requesting university receipt with tax details",
        description:
          "Need an official PDF invoice receipt with student discount details.",
        status: "closed" as const,
        createdAt: daysAgo(8),
      },
      {
        id: `stk_layla_extension`,
        userId: "usr_layla_ahmed",
        subject: "Browser extension sync latency",
        description:
          "Noticed a slight delay syncing quick bookmarks from the Chrome extension.",
        status: "open" as const,
        createdAt: daysAgo(2),
      },
    ];

    for (const st of supportTicketsList) {
      await db.insert(supportTicket).values(st).onConflictDoNothing();
    }
    track("supportTickets", supportTicketsList.length);

    const feedbacksList = [
      {
        id: `fbk_${primaryUserId}_rtl`,
        userId: primaryUserId,
        type: "suggestion" as const,
        subject: "Arabic RTL layout looks wonderful",
        description:
          "The Arabic typography and right-to-left layout transitions are fluid and clean.",
        status: "reviewed" as const,
        createdAt: daysAgo(12),
      },
      {
        id: `fbk_sarah_shortcut`,
        userId: "usr_sarah_jenkins",
        type: "suggestion" as const,
        subject: "Add keyboard shortcut 'd' to complete selected todo",
        description:
          "Vim-style navigation or single-key shortcuts for todo checkboxes would be super fast.",
        status: "new" as const,
        createdAt: daysAgo(2),
      },
      {
        id: `fbk_omar_darkmode`,
        userId: "usr_omar_farooq",
        type: "complaint" as const,
        subject: "Dark mode contrast in journal code blocks",
        description:
          "Certain syntax highlighted code tokens are slightly low contrast in dark theme.",
        status: "reviewed" as const,
        createdAt: daysAgo(5),
      },
    ];

    for (const fb of feedbacksList) {
      await db.insert(feedback).values(fb).onConflictDoNothing();
    }
    track("feedbacks", feedbacksList.length);

    // ─── 24. System Announcements ────────────────────────────────────────────
    const announcementsList = [
      {
        id: `ann_v2_release`,
        titleAr: "إطلاق الإصدار ٢.٠ من المنصة",
        titleEn: "Almostafa Platform Official Release",
        contentAr:
          "يسعدنا الإعلان عن إطلاق المنصة التعليمية لمعهد المصطفى لتعليم القرآن الكريم بميزات محسّنة وتحليلات متطورة.",
        contentEn:
          "We are thrilled to launch the Almostafa learning portal with enhanced study circle tracking and improved student experience.",
        type: AnnouncementType.FEATURE,
        targetType: "all" as const,
        createdBy: primaryUserId,
        publishedAt: daysAgo(10),
      },
      {
        id: `ann_maintenance`,
        titleAr: "صيانة مجدولة للبنية التحتية",
        titleEn: "Scheduled Infrastructure Maintenance",
        contentAr:
          "صيانة دورية خفيفة لمدة ١٥ دقيقة خلال عطلة نهاية الأسبوع لتعزيز أداء قواعد البيانات.",
        contentEn:
          "Routine 15-minute maintenance window this weekend to boost database performance.",
        type: AnnouncementType.MAINTENANCE,
        targetType: "all" as const,
        createdBy: primaryUserId,
        publishedAt: daysAgo(2),
        expiresAt: daysAhead(5),
      },
      {
        id: `ann_pro_exclusive`,
        titleAr: "ميزة حصرية للمشتركين: شبكة المعرفة المتقدمة",
        titleEn: "Pro Exclusive: Deep Knowledge Graph",
        contentAr:
          "استكشف الروابط التفاعلية ثنائية الاتجاه بين الكتب والملاحظات والمقالات وقوائم الفيديو.",
        contentEn:
          "Explore interactive bi-directional links connecting your books, notes, and video playlists.",
        type: AnnouncementType.PROMOTION,
        targetType: "role" as const,
        targetValue: "admin",
        createdBy: primaryUserId,
        publishedAt: daysAgo(3),
      },
    ];

    for (const a of announcementsList) {
      await db.insert(announcement).values(a).onConflictDoNothing();
    }
    track("announcements", announcementsList.length);

    // Mark seen for primary user
    await db
      .insert(usersAnnouncement)
      .values({
        id: `uann_${primaryUserId}_${announcementsList[0].id}`,
        userId: primaryUserId,
        announcementId: announcementsList[0].id,
        seenAt: daysAgo(8),
      })
      .onConflictDoNothing();

    // ─── 27. Newsletter Subscribers & Campaigns ──────────────────────────────
    const subscribersList = [
      {
        email: "subscriber.layla@example.com",
        locale: "en",
        status: "active" as const,
      },
      {
        email: "subscriber.ahmed@example.com",
        locale: "ar",
        status: "active" as const,
      },
      {
        email: "subscriber.ziad@example.com",
        locale: "ar",
        status: "active" as const,
      },
      {
        email: "subscriber.sarah@example.com",
        locale: "en",
        status: "active" as const,
      },
      {
        email: "subscriber.unsub@example.com",
        locale: "en",
        status: "unsubscribed" as const,
      },
    ];

    const subscriberIds: string[] = [];
    for (const sub of subscribersList) {
      const subId = `nls_${sub.email.replace(/[^a-zA-Z0-9]/g, "_")}`;
      await db
        .insert(newsletterSubscriber)
        .values({
          id: subId,
          email: sub.email,
          locale: sub.locale,
          status: sub.status,
          unsubscribeToken: createId(),
          createdAt: daysAgo(30),
        })
        .onConflictDoNothing();
      subscriberIds.push(subId);
    }
    track("newsletterSubscribers", subscribersList.length);

    const campaignId = `cmp_monthly_digest`;
    await db
      .insert(newsletterCampaign)
      .values({
        id: campaignId,
        subjectAr: "النشرة الدورية: أفضل الممارسات لتنظيم وإنجاز الأعمال",
        subjectEn:
          "Almostafa Monthly: Best Practices for Quran Memorization and Tajweed",
        bodyAr:
          "مرحباً بكم في نشرتنا الشهرية. نستعرض هذا الشهر أهم استراتيجيات تنظيم المشاريع وإدارة الأولويات...",
        bodyEn:
          "Welcome to our monthly digest. This month we break down the most effective frameworks for productivity and project management...",
        status: "completed",
        createdBy: primaryUserId,
        startedAt: daysAgo(7),
        completedAt: daysAgo(7),
        isWebsitePublic: true,
        slug: "october-2026-product-digest",
        excerptEn:
          "Frameworks for consistency, book highlights, and habit streak science.",
        excerptAr:
          "أطر عمل للاستمرارية، وأبرز مقتطفات الكتب، وعلم استدامة العادات.",
      })
      .onConflictDoNothing();
    track("newsletterCampaigns", 1);

    for (const sId of subscriberIds.slice(0, 4)) {
      await db
        .insert(newsletterCampaignSend)
        .values({
          id: `csend_${campaignId}_${sId}`,
          campaignId,
          subscriberId: sId,
          status: "sent",
        })
        .onConflictDoNothing();
    }
    track("newsletterCampaignSends", 4);

    return {
      success: true,
      targetUserId: primaryUserId,
      summary,
      message: `Database seeding completed successfully for primary user ${primaryUserId} and secondary users!`,
    };
  },
};
