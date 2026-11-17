import { userApi } from "@/lib/api/user.api";
import { usersApi } from "@/lib/api/users.api";
import { adminApi } from "@/lib/api/admin.api";
import { contactApi } from "@/lib/api/contact.api";
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
import { dashboardSettingsApi } from "@/lib/api/dashboard-settings.api";
import { studentsApi } from "@/lib/api/students.api";
import { teachersApi } from "@/lib/api/teachers.api";
import { classesApi } from "@/lib/api/classes.api";
import { teacherAttendancesApi } from "@/lib/api/teacher-attendances.api";

export const apiClient = {
  user: userApi,
  users: usersApi,
  admin: adminApi,
  contact: contactApi,
  todos: todosApi,
  projects: projectsApi,
  supportTickets: supportTicketsApi,
  feedbacks: feedbacksApi,
  supportStaff: supportStaffApi,
  segments: segmentsApi,
  announcements: announcementsApi,
  adminAnnouncements: adminAnnouncementsApi,
  auth: authApi,
  adminNotifications: adminNotificationsApi,
  adminFcm: adminFcmApi,
  notifications: notificationsApi,
  newsletter: newsletterApi,
  dashboardNewsletter: dashboardNewsletterApi,
  dashboardNewsletters: dashboardNewslettersApi,
  fcm: fcmApi,
  contentNewsletter: contentNewsletterApi,
  dashboardSettings: dashboardSettingsApi,
  students: studentsApi,
  teachers: teachersApi,
  classes: classesApi,
  teacherAttendances: teacherAttendancesApi,
};
