import { z } from "zod";
import {
  ATTACHMENT_PLATFORMS,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/features/projects/types";

export const projectInputSchema = z.object({
  name: z.string().trim().min(3).max(120),
  clientName: z.string().trim().min(2).max(120),
  objective: z.string().trim().max(500).default(""),
  leadId: z.string().trim().default(""),
  lead: z.string().trim().min(2).max(100),
  teamMemberIds: z.array(z.string().min(1)).max(50),
  teamMemberNames: z.array(z.string().min(1)).max(50),
  description: z.string().trim().max(3000).default(""),
  status: z.enum(PROJECT_STATUSES),
  priority: z.enum(PROJECT_PRIORITIES),
  category: z.string().trim().min(2).max(80),
  techStack: z.array(z.string().trim().min(1)).max(30),
  startDate: z.string().date(),
  deadline: z.string().date(),
  budget: z.coerce.number().min(0).max(1_000_000_000_000),
  progress: z.coerce.number().int().min(0).max(100),
  notes: z.string().trim().max(4000).default(""),
}).refine((data) => data.deadline >= data.startDate, {
  message: "Batas waktu tidak boleh lebih awal dari tanggal mulai.",
  path: ["deadline"],
});

export const taskInputSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(1500).default(""),
  assigneeId: z.string().trim().default(""),
  assignee: z.string().trim().max(100).default("Belum ditugaskan"),
  dueDate: z.string().date().or(z.literal("")),
  status: z.enum(TASK_STATUSES).default("TODO"),
  priority: z.enum(TASK_PRIORITIES).default("MEDIUM"),
});

export const taskStatusSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().min(1),
  status: z.enum(TASK_STATUSES),
});

export const reorderTasksSchema = z.object({
  projectId: z.string().min(1),
  taskIds: z.array(z.string().min(1)).max(450),
});

export const commentInputSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().trim().default(""),
  taskTitle: z.string().trim().max(200).default(""),
  message: z.string().trim().min(1, "Komentar tidak boleh kosong.").max(2000),
});

export const attachmentInputSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().trim().default(""),
  taskTitle: z.string().trim().max(200).default(""),
  title: z.string().trim().min(2).max(120),
  url: z.string().trim().url().refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }, "Lampiran hanya menerima tautan yang diawali http:// atau https://."),
  platform: z.enum(ATTACHMENT_PLATFORMS),
});
