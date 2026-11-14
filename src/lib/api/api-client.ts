import { userApi } from "@/lib/api/user.api";
import { usersApi } from "@/lib/api/users.api";
import { adminApi } from "@/lib/api/admin.api";
import { contactApi } from "@/lib/api/contact.api";
import {
  subscriptionApi,
  adminSubscriptionsApi,
} from "@/lib/api/subscription.api";
import { couponsApi, adminCouponsApi } from "@/lib/api/coupons.api";
import { todosApi } from "@/lib/api/todos.api";
import { projectsApi } from "@/lib/api/projects.api";
import { supportTicketsApi } from "@/lib/api/support-tickets.api";
import { feedbacksApi } from "@/lib/api/feedbacks.api";
import { supportStaffApi } from "@/lib/api/support-staff.api";
import { segmentsApi } from "@/lib/api/segments.api";
import {
  announcementsApi,
  adminAnnouncementsApi,
} from "@/lib/api/announcements.api";
import { blogsApi, blogCommentsApi, adminBlogsApi } from "@/lib/api/blogs.api";
import { authApi } from "@/lib/api/auth.api";
import {
  notificationsApi,
  adminNotificationsApi,
} from "@/lib/api/notifications.api";
import {
  newsletterApi,
  dashboardNewsletterApi,
  dashboardNewslettersApi,
  contentNewsletterApi,
} from "@/lib/api/newsletter.api";
import { fcmApi, adminFcmApi } from "@/lib/api/fcm.api";
import { contentAssetsApi } from "@/lib/api/content-assets.api";
import { dashboardSettingsApi } from "@/lib/api/dashboard-settings.api";

export const apiClient = {
  user: userApi,
  users: usersApi,
  admin: adminApi,
  contact: contactApi,
  subscription: subscriptionApi,
  adminSubscriptions: adminSubscriptionsApi,
  coupons: couponsApi,
  adminCoupons: adminCouponsApi,
  todos: todosApi,
  projects: projectsApi,
  supportTickets: supportTicketsApi,
  feedbacks: feedbacksApi,
  supportStaff: supportStaffApi,
  segments: segmentsApi,
  announcements: announcementsApi,
  blogs: blogsApi,
  blogComments: blogCommentsApi,
  adminAnnouncements: adminAnnouncementsApi,
  adminBlogs: adminBlogsApi,
  auth: authApi,
  adminNotifications: adminNotificationsApi,
  adminFcm: adminFcmApi,
  notifications: notificationsApi,
  newsletter: newsletterApi,
  dashboardNewsletter: dashboardNewsletterApi,
  dashboardNewsletters: dashboardNewslettersApi,
  fcm: fcmApi,
  contentNewsletter: contentNewsletterApi,
  contentAssets: contentAssetsApi,
  dashboardSettings: dashboardSettingsApi,
};
