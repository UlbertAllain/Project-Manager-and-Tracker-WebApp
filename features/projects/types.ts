export const PROJECT_STATUSES = ["BACKLOG", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"] as const;
export const PROJECT_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "REVISION", "BLOCKED", "DONE"] as const;
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const ATTACHMENT_PLATFORMS = ["Google Drive", "Figma", "GitHub", "Notion", "Dokumen", "Lainnya"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type AttachmentPlatform = (typeof ATTACHMENT_PLATFORMS)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  BACKLOG: "Rencana",
  IN_PROGRESS: "Berjalan",
  REVIEW: "Tinjauan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "Belum mulai",
  IN_PROGRESS: "Dikerjakan",
  REVIEW: "Menunggu tinjauan",
  REVISION: "Perlu revisi",
  BLOCKED: "Terhambat",
  DONE: "Selesai",
};

export const PRIORITY_LABELS: Record<ProjectPriority | TaskPriority, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  URGENT: "Mendesak",
};

export interface Project {
  id: string;
  name: string;
  clientName: string;
  objective: string;
  description: string;
  leadId: string;
  lead: string;
  teamMemberIds: string[];
  teamMemberNames: string[];
  status: ProjectStatus;
  priority: ProjectPriority;
  category: string;
  techStack: string[];
  startDate: string;
  deadline: string;
  budget: number;
  paidAmount: number;
  totalExpense: number;
  progress: number;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  description: string;
  assigneeId: string;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  completed: boolean;
  order: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  taskId: string;
  taskTitle: string;
  message: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
}

export interface ProjectAttachment {
  id: string;
  projectId: string;
  taskId: string;
  taskTitle: string;
  title: string;
  url: string;
  platform: AttachmentPlatform;
  createdBy: string;
  creatorName: string;
  createdAt: string;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  actorId: string;
  actorName: string;
  action: string;
  message: string;
  createdAt: string;
}
