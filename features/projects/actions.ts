"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canAccessProject, canManageProject, requireAdmin, requireProjectManager, requireUser } from "@/lib/auth/guards";
import {
  attachmentInputSchema,
  commentInputSchema,
  projectInputSchema,
  reorderTasksSchema,
  taskInputSchema,
  taskStatusSchema,
} from "@/features/projects/schema";
import {
  addActivity,
  addAttachment,
  addComment,
  addTask,
  createProject,
  deleteAttachment,
  deleteComment,
  deleteProject,
  deleteTask,
  getProject,
  getTask,
  reorderTasks,
  setTaskStatus,
  updateProject,
} from "@/lib/repositories/projects";
import { PROJECT_STATUSES, type ProjectStatus } from "@/features/projects/types";
import { listUsers } from "@/lib/repositories/users";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

async function projectPayload(formData: FormData) {
  const users = await listUsers();
  const userMap = new Map(users.map((user) => [user.uid, user]));
  const leadId = text(formData, "leadId");
  const teamMemberIds = formData.getAll("teamMemberIds").map(String).filter(Boolean);
  return projectInputSchema.parse({
    name: text(formData, "name"),
    clientName: text(formData, "clientName"),
    objective: text(formData, "objective"),
    leadId,
    lead: userMap.get(leadId)?.name ?? (text(formData, "lead") || "Belum ditentukan"),
    teamMemberIds,
    teamMemberNames: teamMemberIds.map((uid) => userMap.get(uid)?.name ?? "Anggota tim"),
    description: text(formData, "description"),
    status: text(formData, "status"),
    priority: text(formData, "priority"),
    category: text(formData, "category"),
    techStack: text(formData, "techStack").split(",").map((item) => item.trim()).filter(Boolean),
    startDate: text(formData, "startDate"),
    deadline: text(formData, "deadline"),
    budget: text(formData, "budget"),
    progress: text(formData, "progress"),
    notes: text(formData, "notes"),
  });
}

function revalidateProject(projectId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/board");
  revalidatePath("/my-work");
  revalidatePath("/reports");
  revalidatePath(`/projects/${projectId}`);
}

async function accessibleProject(projectId: string) {
  const user = await requireUser();
  const project = await getProject(projectId);
  if (!project || !canAccessProject(user, project)) throw new Error("Project tidak ditemukan atau tidak dapat diakses.");
  return { user, project };
}

async function manageableProject(projectId: string) {
  const user = await requireUser();
  const project = await getProject(projectId);
  if (!project || !canManageProject(user, project)) throw new Error("Kamu tidak memiliki izin mengelola project ini.");
  return { user, project };
}

export async function createProjectAction(formData: FormData) {
  const user = await requireProjectManager();
  const payload = await projectPayload(formData);
  const projectId = await createProject({ ...payload, createdBy: user.uid });
  await addActivity(projectId, {
    actorId: user.uid,
    actorName: user.name,
    action: "PROJECT_CREATED",
    message: `${user.name} membuat project ini.`,
  });
  redirect(`/projects/${projectId}`);
}

export async function updateProjectAction(formData: FormData) {
  const projectId = text(formData, "projectId");
  const { user } = await manageableProject(projectId);
  const payload = await projectPayload(formData);
  await updateProject(projectId, payload);
  await addActivity(projectId, {
    actorId: user.uid,
    actorName: user.name,
    action: "PROJECT_UPDATED",
    message: `${user.name} memperbarui informasi project.`,
  });
  revalidateProject(projectId);
  redirect(`/projects/${projectId}`);
}

export async function deleteProjectAction(formData: FormData) {
  await requireAdmin();
  await deleteProject(text(formData, "projectId"));
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/board");
  revalidatePath("/reports");
  redirect("/projects");
}

export async function updateProjectStatusAction(formData: FormData) {
  const projectId = text(formData, "projectId");
  const { user } = await manageableProject(projectId);
  const rawStatus = text(formData, "status");
  if (!PROJECT_STATUSES.includes(rawStatus as ProjectStatus)) throw new Error("Status project tidak valid.");
  const status = rawStatus as ProjectStatus;
  await updateProject(projectId, { status, ...(status === "COMPLETED" ? { progress: 100 } : {}) });
  await addActivity(projectId, {
    actorId: user.uid,
    actorName: user.name,
    action: "PROJECT_STATUS",
    message: `${user.name} memindahkan status project ke ${status}.`,
  });
  revalidateProject(projectId);
}

export async function addTaskAction(formData: FormData) {
  const projectId = text(formData, "projectId");
  const { user } = await manageableProject(projectId);
  const payload = taskInputSchema.parse({
    projectId,
    title: text(formData, "title"),
    description: text(formData, "description"),
    assigneeId: text(formData, "assigneeId"),
    assignee: text(formData, "assignee"),
    dueDate: text(formData, "dueDate"),
    status: text(formData, "status") || "TODO",
    priority: text(formData, "priority") || "MEDIUM",
  });
  const { projectId: _projectId, ...taskData } = payload;
  void _projectId;
  await addTask(payload.projectId, { ...taskData, createdBy: user.uid });
  await addActivity(projectId, {
    actorId: user.uid,
    actorName: user.name,
    action: "TASK_CREATED",
    message: `${user.name} menambahkan task “${payload.title}”.`,
  });
  revalidateProject(projectId);
}

export async function updateTaskStatusAction(formData: FormData) {
  const payload = taskStatusSchema.parse({
    projectId: text(formData, "projectId"),
    taskId: text(formData, "taskId"),
    status: text(formData, "status"),
  });
  const { user, project } = await accessibleProject(payload.projectId);
  const task = await getTask(payload.projectId, payload.taskId);
  if (!task) throw new Error("Task tidak ditemukan.");
  const canUpdate = canManageProject(user, project)
    || task.assigneeId === user.uid
    || (!task.assigneeId && task.assignee.toLowerCase() === user.name.toLowerCase());
  if (!canUpdate) throw new Error("Kamu hanya dapat memperbarui task yang ditugaskan kepadamu.");
  await setTaskStatus(payload.projectId, payload.taskId, payload.status);
  await addActivity(payload.projectId, {
    actorId: user.uid,
    actorName: user.name,
    action: "TASK_STATUS",
    message: `${user.name} mengubah “${task.title}” menjadi ${payload.status}.`,
  });
  revalidateProject(payload.projectId);
}

export async function toggleTaskAction(formData: FormData) {
  formData.set("status", text(formData, "completed") === "true" ? "DONE" : "TODO");
  await updateTaskStatusAction(formData);
}

export async function reorderTasksAction(formData: FormData) {
  const projectId = text(formData, "projectId");
  await manageableProject(projectId);
  const parsedIds = JSON.parse(text(formData, "taskIds") || "[]") as unknown;
  const payload = reorderTasksSchema.parse({ projectId, taskIds: parsedIds });
  await reorderTasks(payload.projectId, payload.taskIds);
  revalidatePath(`/projects/${payload.projectId}`);
}

export async function deleteTaskAction(formData: FormData) {
  const projectId = text(formData, "projectId");
  const { user } = await manageableProject(projectId);
  const task = await getTask(projectId, text(formData, "taskId"));
  await deleteTask(projectId, text(formData, "taskId"));
  await addActivity(projectId, {
    actorId: user.uid,
    actorName: user.name,
    action: "TASK_DELETED",
    message: `${user.name} menghapus task “${task?.title ?? "Task"}”.`,
  });
  revalidateProject(projectId);
}

export async function addCommentAction(formData: FormData) {
  const projectId = text(formData, "projectId");
  const { user } = await accessibleProject(projectId);
  const payload = commentInputSchema.parse({
    projectId,
    taskId: text(formData, "taskId"),
    taskTitle: text(formData, "taskTitle"),
    message: text(formData, "message"),
  });
  await addComment(projectId, {
    taskId: payload.taskId,
    taskTitle: payload.taskTitle,
    message: payload.message,
    authorId: user.uid,
    authorName: user.name,
    authorEmail: user.email,
  });
  await addActivity(projectId, {
    actorId: user.uid,
    actorName: user.name,
    action: "COMMENT_ADDED",
    message: `${user.name} menambahkan laporan${payload.taskTitle ? ` pada “${payload.taskTitle}”` : " project"}.`,
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteCommentAction(formData: FormData) {
  const { user } = await accessibleProject(text(formData, "projectId"));
  const projectId = text(formData, "projectId");
  await deleteComment(projectId, text(formData, "commentId"), user.uid, user.role === "ADMIN");
  revalidatePath(`/projects/${projectId}`);
}

export async function addAttachmentAction(formData: FormData) {
  const projectId = text(formData, "projectId");
  const { user } = await accessibleProject(projectId);
  const payload = attachmentInputSchema.parse({
    projectId,
    taskId: text(formData, "taskId"),
    taskTitle: text(formData, "taskTitle"),
    title: text(formData, "title"),
    url: text(formData, "url"),
    platform: text(formData, "platform"),
  });
  await addAttachment(projectId, {
    taskId: payload.taskId,
    taskTitle: payload.taskTitle,
    title: payload.title,
    url: payload.url,
    platform: payload.platform,
    createdBy: user.uid,
    creatorName: user.name,
  });
  await addActivity(projectId, {
    actorId: user.uid,
    actorName: user.name,
    action: "ATTACHMENT_ADDED",
    message: `${user.name} melampirkan “${payload.title}”.`,
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteAttachmentAction(formData: FormData) {
  const projectId = text(formData, "projectId");
  const { user } = await accessibleProject(projectId);
  await deleteAttachment(projectId, text(formData, "attachmentId"), user.uid, user.role === "ADMIN");
  revalidatePath(`/projects/${projectId}`);
}
