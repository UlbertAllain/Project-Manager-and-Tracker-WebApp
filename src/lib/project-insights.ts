import type { Project, ProjectTask } from "@/features/projects/types";
import { isOverdue, parseDateValue } from "@/lib/format";

export function daysUntil(value: string) {
  const date = parseDateValue(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

export function projectHealth(project: Project, tasks: ProjectTask[] = []) {
  if (project.status === "COMPLETED") return { label: "Selesai", tone: "success" as const, score: 100 };
  if (project.status === "CANCELLED") return { label: "Dibatalkan", tone: "muted" as const, score: 0 };
  const overdueTasks = tasks.filter((task) => task.status !== "DONE" && isOverdue(task.dueDate, task.status)).length;
  const blocked = tasks.filter((task) => task.status === "BLOCKED").length;
  const deadlineDays = daysUntil(project.deadline);
  let score = 100;
  if (isOverdue(project.deadline, project.status)) score -= 45;
  else if (deadlineDays !== null && deadlineDays <= 7) score -= 15;
  score -= Math.min(30, overdueTasks * 8);
  score -= Math.min(25, blocked * 12);
  if (project.progress < 30 && deadlineDays !== null && deadlineDays <= 14) score -= 15;
  score = Math.max(0, score);
  if (score >= 80) return { label: "Sehat", tone: "success" as const, score };
  if (score >= 55) return { label: "Perlu dipantau", tone: "warning" as const, score };
  return { label: "Berisiko", tone: "danger" as const, score };
}

export function taskSummary(tasks: ProjectTask[]) {
  return {
    total: tasks.length,
    done: tasks.filter((task) => task.status === "DONE").length,
    review: tasks.filter((task) => task.status === "REVIEW").length,
    revision: tasks.filter((task) => task.status === "REVISION").length,
    blocked: tasks.filter((task) => task.status === "BLOCKED").length,
    overdue: tasks.filter((task) => task.status !== "DONE" && isOverdue(task.dueDate, task.status)).length,
  };
}
