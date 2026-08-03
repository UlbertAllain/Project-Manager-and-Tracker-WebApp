import { create } from "zustand";
import { Project } from "@/lib/types";
import { getDeadlineInfo, getTaskDueInfo } from "@/lib/helpers";

// ==================== NOTIFICATION TYPES ====================

export type NotificationType =
  | "deadline_warning"
  | "due_today"
  | "overdue"
  | "task_due_today"
  | "task_overdue"
  | "status_change"
  | "payment_update";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  projectId?: string;
  projectName?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  generateFromProjects: (projects: Project[]) => void;
}

// Generate a stable ID from project ID + notification type
function generateNotificationId(
  projectId: string,
  type: NotificationType
): string {
  return `${projectId}-${type}`;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    const id = generateNotificationId(
      notification.projectId || Math.random().toString(36).slice(2),
      notification.type
    );

    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      read: false,
    };

    set((state) => {
      // Avoid duplicates by ID
      const existing = state.notifications.find((n) => n.id === id);
      if (existing) return state;

      const updated = [newNotification, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      return {
        notifications: updated,
        unreadCount: 0,
      };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  generateFromProjects: (projects) => {
    const newNotifications: Notification[] = [];

    for (const project of projects) {
      // Skip completed or cancelled projects
      if (project.status === "COMPLETED" || project.status === "CANCELLED")
        continue;

      if (project.deadline) {
        const deadline = getDeadlineInfo(project.status, project.deadline);
        const timestamp = new Date(project.deadline);

        if (deadline.severity === "OVERDUE") {
          newNotifications.push({
            id: generateNotificationId(project.id, "overdue"),
            type: "overdue",
            title: "Project Overdue",
            message: `${project.projectName} sudah melewati deadline ${Math.abs(deadline.daysRemaining ?? 0)} hari`,
            projectId: project.id,
            projectName: project.projectName,
            timestamp,
            read: false,
          });
        } else if (deadline.severity === "DUE_TODAY") {
          newNotifications.push({
            id: generateNotificationId(project.id, "due_today"),
            type: "due_today",
            title: "Deadline Hari Ini",
            message: `${project.projectName} perlu diselesaikan hari ini`,
            projectId: project.id,
            projectName: project.projectName,
            timestamp,
            read: false,
          });
        } else if (deadline.severity === "DUE_SOON") {
          newNotifications.push({
            id: generateNotificationId(project.id, "deadline_warning"),
            type: "deadline_warning",
            title: "Deadline Mendekat",
            message: `${project.projectName} deadline dalam ${deadline.daysRemaining} hari`,
            projectId: project.id,
            projectName: project.projectName,
            timestamp,
            read: false,
          });
        }
      }

      // Check for unpaid or partial payment
      if (
        project.paymentStatus === "UNPAID" ||
        project.paymentStatus === "PARTIAL"
      ) {
        const paymentLabel =
          project.paymentStatus === "UNPAID" ? "belum dibayar" : "belum lunas";
        newNotifications.push({
          id: generateNotificationId(project.id, "payment_update"),
          type: "payment_update",
          title: "Pembayaran Belum Lunas",
          message: `${project.projectName} — pembayaran ${paymentLabel}`,
          projectId: project.id,
          projectName: project.projectName,
          timestamp: new Date(project.updatedAt || project.createdAt),
          read: false,
        });
      }

      const overdueTasks = project.tasks.filter(
        (task) => getTaskDueInfo(task.dueDate, task.isCompleted).severity === "OVERDUE"
      );
      if (overdueTasks.length > 0) {
        newNotifications.push({
          id: generateNotificationId(project.id, "task_overdue"),
          type: "task_overdue",
          title: "Task Overdue",
          message: `${project.projectName} punya ${overdueTasks.length} task yang melewati due date`,
          projectId: project.id,
          projectName: project.projectName,
          timestamp: new Date(),
          read: false,
        });
      }

      const dueTodayTasks = project.tasks.filter(
        (task) => getTaskDueInfo(task.dueDate, task.isCompleted).severity === "DUE_TODAY"
      );
      if (dueTodayTasks.length > 0) {
        newNotifications.push({
          id: generateNotificationId(project.id, "task_due_today"),
          type: "task_due_today",
          title: "Task Due Hari Ini",
          message: `${project.projectName} punya ${dueTodayTasks.length} task yang jatuh tempo hari ini`,
          projectId: project.id,
          projectName: project.projectName,
          timestamp: new Date(),
          read: false,
        });
      }
    }

    // Preserve read state from existing notifications
    const currentNotifications = get().notifications;
    const readMap = new Map<string, boolean>();
    for (const n of currentNotifications) {
      readMap.set(n.id, n.read);
    }

    // Merge: use new notifications but preserve read state
    const merged = newNotifications.map((n) => ({
      ...n,
      read: readMap.get(n.id) ?? false,
    }));

    // Sort: unread first, then by timestamp descending
    merged.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    set({
      notifications: merged,
      unreadCount: merged.filter((n) => !n.read).length,
    });
  },
}));
