import { createId } from "@paralleldrive/cuid2";
import { eq, inArray } from "drizzle-orm";

import { db } from "@/server/db";
import {
  announcement,
  appSettings,
  blog,
  blogsComment,
  feedback,
  mediaFile,
  newsletterCampaign,
  newsletterCampaignSend,
  newsletterSubscriber,
  notification,
  project,
  segment,
  supportTicket,
  todo,
  user,
  usersAnnouncement,
} from "@/server/db/schema";
import { ForbiddenException } from "@/server/exceptions/exceptions";
import { env } from "@/server/lib/env";
import { AnnouncementType } from "@/shared/enums/announcement-type.enum";
import { type ColorKey } from "@/shared/constants/color-palette";

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
    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
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
    const daysAgoStr = (n: number) => toDateStr(daysAgo(n));
    const daysAheadStr = (n: number) => toDateStr(daysAhead(n));
    const todayStr = toDateStr(now);

    const summary: Record<string, number> = {};
    const track = (key: string, count: number) => {
      summary[key] = (summary[key] || 0) + count;
    };

    // User tags collection across all seed steps
    const userTagsMap = new Map<string, Set<string>>();
    const registerUserTags = (userId: string, tags: string[]) => {
      if (!userTagsMap.has(userId)) {
        userTagsMap.set(userId, new Set());
      }
      const set = userTagsMap.get(userId)!;
      for (const t of tags) {
        if (t && t.trim()) set.add(t.trim());
      }
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
        phone: "+201000000000",
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
          phone: "+201011112222",
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
      await db.delete(todo).where(eq(todo.userId, primaryUserId));
      await db.delete(project).where(eq(project.userId, primaryUserId));
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
      await db.delete(mediaFile).where(eq(mediaFile.uploadedBy, primaryUserId));

      // 2. Clean secondary users data so multi-user analytics & tickets refresh with fresh dates
      const secondaryUserIds = secondaryUsers.map((u) => u.id);
      await db
        .delete(supportTicket)
        .where(inArray(supportTicket.userId, secondaryUserIds));
      await db
        .delete(feedback)
        .where(inArray(feedback.userId, secondaryUserIds));
      await db
        .delete(blogsComment)
        .where(inArray(blogsComment.userId, secondaryUserIds));

      // 3. Clean system-level seed items so their publishedAt / startsAt dates are refreshed to today
      await db
        .delete(blog)
        .where(
          inArray(blog.slug, [
            "the-one-percent-habit-rule",
            "the-architecture-of-deep-focus",
          ]),
        );
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

    // ─── 7. Projects ─────────────────────────────────────────────────────────
    const primaryProjects = [
      {
        id: `prj_${primaryUserId}_health`,
        userId: primaryUserId,
        name: "Health & Vitality",
        description:
          "Daily workouts, running, sleep optimization, and mobility.",
        colorKey: "green" as ColorKey,
        icon: "💪",
        isArchived: false,
      },
      {
        id: `prj_${primaryUserId}_platform`,
        userId: primaryUserId,
        name: "Core Platform Development",
        description:
          "Full-stack SaaS boilerplate architecture, UI/UX polish, and features.",
        colorKey: "blue" as ColorKey,
        icon: "🚀",
        isArchived: false,
      },
      {
        id: `prj_${primaryUserId}_learning`,
        userId: primaryUserId,
        name: "Continuous Learning",
        description:
          "Non-fiction reading queue, programming courses, and knowledge synthesis.",
        colorKey: "purple" as ColorKey,
        icon: "📚",
        isArchived: false,
      },
      {
        id: `prj_${primaryUserId}_finance`,
        userId: primaryUserId,
        name: "Personal Wealth & Finance",
        description: "Monthly budgeting, investments, financial tracking.",
        colorKey: "yellow" as ColorKey,
        icon: "💼",
        isArchived: false,
      },
      {
        id: `prj_${primaryUserId}_archived`,
        userId: primaryUserId,
        name: "Legacy Blog Archive",
        description: "Archived content and completed migration tasks.",
        colorKey: "gray" as ColorKey,
        icon: "📦",
        isArchived: true,
      },
    ];

    for (const p of primaryProjects) {
      await db.insert(project).values(p).onConflictDoNothing();
    }
    track("projects", primaryProjects.length);

    // ─── 8. Todos (Relative dates: overdue, today, upcoming, completed) ───────
    const pHealth = primaryProjects[0].id;
    const pPlatform = primaryProjects[1].id;
    const pLearning = primaryProjects[2].id;
    const pFinance = primaryProjects[3].id;

    const primaryTodos = [
      // Overdue
      {
        id: `td_${primaryUserId}_reconcile`,
        userId: primaryUserId,
        projectId: pFinance,
        title: "Reconcile October monthly investment statement",
        priority: "high" as const,
        isCompleted: false,
        dueDate: daysAgoStr(2),
        checklist: [
          { id: "c1", title: "Download bank PDF", isCompleted: true },
          { id: "c2", title: "Update net worth ledger", isCompleted: false },
        ],
      },
      // Today (Active)
      {
        id: `td_${primaryUserId}_deepwork`,
        userId: primaryUserId,
        projectId: pPlatform,
        title: "Morning 90-min deep work: Finish local seeding endpoint",
        priority: "high" as const,
        isCompleted: false,
        dueDate: todayStr,
        checklist: [
          {
            id: "c3",
            title: "Implement seed service logic",
            isCompleted: true,
          },
          {
            id: "c4",
            title: "Verify with local database CLI",
            isCompleted: true,
          },
          {
            id: "c5",
            title: "Test UI dashboard rendering",
            isCompleted: false,
          },
        ],
      },
      {
        id: `td_${primaryUserId}_gym_session`,
        userId: primaryUserId,
        projectId: pHealth,
        title: "Afternoon 45-min gym strength session",
        priority: "medium" as const,
        isCompleted: false,
        dueDate: todayStr,
        checklist: [],
      },
      {
        id: `td_${primaryUserId}_read_deepwork`,
        userId: primaryUserId,
        projectId: pLearning,
        title: "Read 25 pages of Deep Work by Cal Newport",
        priority: "medium" as const,
        isCompleted: false,
        dueDate: todayStr,
        checklist: [],
      },
      // Today (Completed)
      {
        id: `td_${primaryUserId}_morning_hydration`,
        userId: primaryUserId,
        projectId: pHealth,
        title: "Morning hydration (750ml water) & light stretching",
        priority: "low" as const,
        isCompleted: true,
        dueDate: todayStr,
        checklist: [],
      },
      // Upcoming
      {
        id: `td_${primaryUserId}_review_prs`,
        userId: primaryUserId,
        projectId: pPlatform,
        title: "Review pull requests & update dependency packages",
        priority: "medium" as const,
        isCompleted: false,
        dueDate: daysAheadStr(2),
        checklist: [],
      },
      {
        id: `td_${primaryUserId}_smoke_tests`,
        userId: primaryUserId,
        projectId: pPlatform,
        title: "Run smoke tests and verify staging deployment",
        priority: "high" as const,
        isCompleted: false,
        dueDate: daysAheadStr(4),
        checklist: [],
      },
      {
        id: `td_${primaryUserId}_atomic_summary`,
        userId: primaryUserId,
        projectId: pLearning,
        title: "Write chapter summary for Atomic Habits Chapter 4",
        priority: "low" as const,
        isCompleted: false,
        dueDate: daysAheadStr(5),
        checklist: [],
      },
      // Inbox (No due date)
      {
        id: `td_${primaryUserId}_pg_search`,
        userId: primaryUserId,
        projectId: null,
        title: "Investigate PostgreSQL full-text search improvements",
        priority: "low" as const,
        isCompleted: false,
        dueDate: null,
        checklist: [],
      },
      // Past Completed
      {
        id: `td_${primaryUserId}_rtl_architecture`,
        userId: primaryUserId,
        projectId: pPlatform,
        title: "Architecture design for multi-language RTL support",
        priority: "high" as const,
        isCompleted: true,
        dueDate: daysAgoStr(4),
        checklist: [],
      },
    ];

    for (const t of primaryTodos) {
      await db.insert(todo).values(t).onConflictDoNothing();
    }
    track("todos", primaryTodos.length);

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

    // ─── 25. Public Marketing Blogs & Comments ───────────────────────────────
    const publicBlogsList = [
      {
        id: `blg_one_percent_rule`,
        slug: "the-one-percent-habit-rule",
        titleEn: "The 1% Rule: Compounding Small Daily Habits",
        titleAr: "قاعدة الـ ١٪: كيف تتضاعف العادات اليومية البسيطة",
        descriptionEn:
          "Why getting 1% better every day yields astronomical growth over time.",
        descriptionAr:
          "لماذا يُحدث التحسن بنسبة ١٪ يومياً نتائج هائلة على المدى الطويل.",
        excerptEn:
          "Small habits don't add up, they compound. Discover the mathematics behind sustainable self-mastery.",
        excerptAr:
          "العادات الصغيرة لا تُجمع بل تتضاعف هندسياً. اكتشف الأثر التراكمي للالتزام اليومي البسيط.",
        contentEn: `# The 1% Rule: Compounding Small Daily Habits\n\nIt is so easy to overestimate the importance of one defining moment and underestimate the value of making small improvements on a daily basis.\n\n### The Math of Compounding\n- If you get 1% better each day for one year, you'll end up **37.78 times better**.\n- If you get 1% worse each day, you decline nearly down to zero.\n\nHabits are the compound interest of self-improvement.`,
        contentAr: `# قاعدة الـ ١٪: كيف تتضاعف العادات اليومية\n\nمن السهل جداً المبالغة في تقدير أهمية لحظة فارقة واحدة، والتقليل من شأن التحسينات الصغيرة المتراكمة يومياً.\n\n### رياضيات المضاعفة\n- إذا تحسنت بنسبة ١٪ يومياً لمدة عام، ستصبح **أفضل بـ ٣٧ ضعفاً**.\n- وإذا تراجعت بنسبة ١٪ يومياً، فستنحدر إلى الصفر تقريباً.\n\nالعادات هي الفائدة المركبة لتطوير الذات.`,
        coverImageUrl:
          "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60",
        readingMinutes: 4,
        authorId: primaryUserId,
        tags: ["habits", "growth", "mindset"],
        status: "published" as const,
        isFeatured: true,
        publishDate: daysAgo(14),
      },
      {
        id: `blg_deep_work_focus`,
        slug: "the-architecture-of-deep-focus",
        titleEn: "The Architecture of Deep Focus in a Distracted World",
        titleAr: "فن التركيز العميق في عصر التشتت",
        descriptionEn:
          "How to engineer environments that protect deep cognitive flow.",
        descriptionAr:
          "كيف تصمم بيئة عمل تحمي ذهنك من التشتت وتطلق العنان للإبداع.",
        excerptEn:
          "Depth is rare and high-value. Learn how to reclaim your undivided attention.",
        excerptAr:
          "التركيز العميق أصبح نادراً وعالي القيمة. تعلم كيف تستعيد سيطرتك الكاملة على انتباهك.",
        contentEn: `# The Architecture of Deep Focus\n\nDeep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information and produce better results in less time.\n\n### Practical Rules:\n1. Work deeply for 90-minute intervals.\n2. Embrace boredom; resist reaching for your phone.\n3. Drain the shallows: limit non-essential communication.`,
        contentAr: `# فن التركيز العميق\n\nالعمل العميق هو القدرة على التركيز الخالي من التشتت في المهام التي تتطلب مجهوداً ذهنياً معقداً.\n\n### قواعد عملية:\n١. خصص فترات تركيز مدتها ٩٠ دقيقة.\n٢. تقبل الملل ولا تلجأ لهاتفك مع أول إشارة للملل.\n٣. قلل الأعمال السطحية ورسائل الدردشة غير العاجلة.`,
        coverImageUrl:
          "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60",
        readingMinutes: 5,
        authorId: primaryUserId,
        tags: ["focus", "productivity", "deep-work"],
        status: "published" as const,
        isFeatured: false,
        publishDate: daysAgo(7),
      },
    ];

    for (const b of publicBlogsList) {
      await db.insert(blog).values(b).onConflictDoNothing();
      registerUserTags(primaryUserId, b.tags);
    }
    track("blogs", publicBlogsList.length);

    // Blog Comments from diverse users
    const blogCommentsList = [
      {
        id: `bcm_${publicBlogsList[0].id}_sarah`,
        blogId: publicBlogsList[0].id,
        userId: "usr_sarah_jenkins",
        body: "Consistent daily Quran recitation has transformed my life. Tracking my daily wird inside Almostafa has made this real for me!",
        createdAt: daysAgo(12),
      },
      {
        id: `bcm_${publicBlogsList[0].id}_karim`,
        blogId: publicBlogsList[0].id,
        userId: "usr_karim_mansour",
        body: "مقال رائع وملهم جداً، فكرة بناء الهوية أولاً غيّرت طريقة التزامي بالمذاكرة والرياضة تماماً.",
        createdAt: daysAgo(10),
      },
      {
        id: `bcm_${publicBlogsList[1].id}_layla`,
        blogId: publicBlogsList[1].id,
        userId: "usr_layla_ahmed",
        body: "Leaving the phone outside my bedroom transformed my mornings completely. Highly recommend this practice.",
        createdAt: daysAgo(5),
      },
    ];

    for (const bc of blogCommentsList) {
      await db.insert(blogsComment).values(bc).onConflictDoNothing();
    }
    track("blogComments", blogCommentsList.length);

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

    // ─── 28. Sample Media Asset (assets table) ───────────────────────────────
    await db
      .insert(mediaFile)
      .values({
        id: `med_${primaryUserId}_sample_cover`,
        publicId: "sample_cover_public_id",
        cloudinaryUrl:
          "https://images.unsplash.com/photo-1499750310107-5fef28a66643",
        secureUrl:
          "https://images.unsplash.com/photo-1499750310107-5fef28a66643",
        resourceType: "image",
        format: "jpg",
        width: 1200,
        height: 800,
        bytes: 184500,
        folder: "blog-covers",
        filename: "habits_cover.jpg",
        originalFilename: "habits_cover.jpg",
        tags: ["habits", "seed"],
        uploadedBy: primaryUserId,
      })
      .onConflictDoNothing();
    track("mediaFiles", 1);

    return {
      success: true,
      targetUserId: primaryUserId,
      summary,
      message: `Database seeding completed successfully for primary user ${primaryUserId} and secondary users!`,
    };
  },
};
