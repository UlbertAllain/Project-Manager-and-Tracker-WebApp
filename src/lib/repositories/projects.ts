import type { DocumentData, DocumentReference, Query } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { SessionUser } from "@/lib/auth/session";
import { canAccessProject } from "@/lib/auth/guards";
import {
  type Project,
  type ProjectActivity,
  type ProjectAttachment,
  type ProjectComment,
  type ProjectPriority,
  type ProjectStatus,
  type ProjectTask,
  type TaskPriority,
  type TaskStatus,
} from "@/features/projects/types";
import { parseDateValue, toDateInputValue, toIsoDateTime } from "@/lib/format";

function removeUndefined(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean);
  } catch {
    // Legacy comma-separated value.
  }
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function projectStatus(value: unknown): ProjectStatus {
  if (["BACKLOG", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"].includes(String(value))) {
    return value as ProjectStatus;
  }
  if (value === "OVERDUE") return "IN_PROGRESS";
  return "BACKLOG";
}

function projectPriority(value: unknown): ProjectPriority {
  return ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(String(value))
    ? value as ProjectPriority
    : "MEDIUM";
}

function taskStatus(data: DocumentData): TaskStatus {
  const value = String(data.status ?? "");
  if (["TODO", "IN_PROGRESS", "REVIEW", "REVISION", "BLOCKED", "DONE"].includes(value)) return value as TaskStatus;
  if (data.completed === true || data.isCompleted === true) return "DONE";
  return "TODO";
}

function taskPriority(value: unknown): TaskPriority {
  return ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(String(value))
    ? value as TaskPriority
    : "MEDIUM";
}

function toProject(id: string, data: DocumentData): Project {
  return {
    id,
    name: String(data.name ?? data.projectName ?? "Proyek tanpa nama"),
    clientName: String(data.clientName ?? "Proyek Internal"),
    objective: String(data.objective ?? data.goal ?? ""),
    description: String(data.description ?? ""),
    leadId: String(data.leadId ?? data.projectLeadId ?? ""),
    lead: String(data.lead ?? data.leadName ?? data.projectLead ?? "Belum ditentukan"),
    teamMemberIds: stringArray(data.teamMemberIds ?? data.memberIds),
    teamMemberNames: stringArray(data.teamMemberNames ?? data.teamMembers),
    status: projectStatus(data.status),
    priority: projectPriority(data.priority),
    category: String(data.category ?? "General"),
    techStack: stringArray(data.techStack),
    startDate: toDateInputValue(data.startDate),
    deadline: toDateInputValue(data.deadline),
    budget: Number(data.budget ?? 0),
    paidAmount: Number(data.paidAmount ?? 0),
    totalExpense: Number(data.totalExpense ?? 0),
    progress: Math.min(100, Math.max(0, Number(data.progress ?? 0))),
    notes: String(data.notes ?? ""),
    createdBy: String(data.createdBy ?? ""),
    createdAt: toIsoDateTime(data.createdAt),
    updatedAt: toIsoDateTime(data.updatedAt),
  };
}

function toTask(projectId: string, id: string, data: DocumentData, projectName = ""): ProjectTask {
  const status = taskStatus(data);
  return {
    id,
    projectId,
    projectName,
    title: String(data.title ?? "Tugas tanpa judul"),
    description: String(data.description ?? ""),
    assigneeId: String(data.assigneeId ?? data.assignedToId ?? ""),
    assignee: String(data.assignee ?? data.assigneeName ?? data.assignedTo ?? "Belum ditugaskan"),
    dueDate: toDateInputValue(data.dueDate),
    status,
    priority: taskPriority(data.priority),
    completed: status === "DONE",
    order: Number(data.order ?? 0),
    createdBy: String(data.createdBy ?? ""),
    createdAt: toIsoDateTime(data.createdAt),
    updatedAt: toIsoDateTime(data.updatedAt),
  };
}

function toComment(projectId: string, id: string, data: DocumentData): ProjectComment {
  return {
    id,
    projectId,
    taskId: String(data.taskId ?? ""),
    taskTitle: String(data.taskTitle ?? ""),
    message: String(data.message ?? ""),
    authorId: String(data.authorId ?? data.userId ?? ""),
    authorName: String(data.authorName ?? data.userName ?? data.userEmail ?? "Anggota tim"),
    authorEmail: String(data.authorEmail ?? data.userEmail ?? ""),
    createdAt: toIsoDateTime(data.createdAt),
  };
}

function toAttachment(projectId: string, id: string, data: DocumentData): ProjectAttachment {
  const platform = ["Google Drive", "Figma", "GitHub", "Notion", "Dokumen", "Lainnya"].includes(String(data.platform))
    ? data.platform
    : "Lainnya";
  return {
    id,
    projectId,
    taskId: String(data.taskId ?? ""),
    taskTitle: String(data.taskTitle ?? ""),
    title: String(data.title ?? "Lampiran"),
    url: String(data.url ?? ""),
    platform,
    createdBy: String(data.createdBy ?? ""),
    creatorName: String(data.creatorName ?? data.userName ?? "Anggota tim"),
    createdAt: toIsoDateTime(data.createdAt),
  } as ProjectAttachment;
}

function toActivity(projectId: string, id: string, data: DocumentData): ProjectActivity {
  return {
    id,
    projectId,
    actorId: String(data.actorId ?? ""),
    actorName: String(data.actorName ?? "Sistem"),
    action: String(data.action ?? "UPDATE"),
    message: String(data.message ?? "Aktivitas project diperbarui."),
    createdAt: toIsoDateTime(data.createdAt ?? data.timestamp),
  };
}

async function deleteQuery(query: Query) {
  const snapshot = await query.get();
  if (snapshot.empty) return;
  const db = getAdminDb();
  for (let offset = 0; offset < snapshot.docs.length; offset += 450) {
    const batch = db.batch();
    snapshot.docs.slice(offset, offset + 450).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

export async function listProjects(user?: SessionUser): Promise<Project[]> {
  const snapshot = await getAdminDb().collection("projects").get();
  const projects = snapshot.docs
    .map((doc) => toProject(doc.id, doc.data()))
    .sort((a, b) => (parseDateValue(b.updatedAt)?.getTime() ?? 0) - (parseDateValue(a.updatedAt)?.getTime() ?? 0));
  return user ? projects.filter((project) => canAccessProject(user, project)) : projects;
}

export async function getProject(projectId: string, user?: SessionUser): Promise<Project | null> {
  const snapshot = await getAdminDb().collection("projects").doc(projectId).get();
  if (!snapshot.exists) return null;
  const project = toProject(snapshot.id, snapshot.data() ?? {});
  return !user || canAccessProject(user, project) ? project : null;
}

export async function createProject(data: Omit<Project, "id" | "paidAmount" | "totalExpense" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const ref = getAdminDb().collection("projects").doc();
  await ref.set({ ...data, paidAmount: 0, totalExpense: 0, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateProject(projectId: string, data: Partial<Project>) {
  const { id: _id, createdAt: _createdAt, createdBy: _createdBy, ...safeData } = data;
  void _id;
  void _createdAt;
  void _createdBy;
  await getAdminDb().collection("projects").doc(projectId).update({
    ...removeUndefined(safeData as Record<string, unknown>),
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProject(projectId: string) {
  const db = getAdminDb();
  const projectRef = db.collection("projects").doc(projectId);
  await Promise.all([
    deleteQuery(projectRef.collection("tasks")),
    deleteQuery(projectRef.collection("comments")),
    deleteQuery(projectRef.collection("attachments")),
    deleteQuery(projectRef.collection("activities")),
    deleteQuery(db.collection("tasks").where("projectId", "==", projectId)),
    deleteQuery(db.collection("comments").where("projectId", "==", projectId)),
    deleteQuery(db.collection("attachments").where("projectId", "==", projectId)),
    deleteQuery(db.collection("activityLogs").where("projectId", "==", projectId)),
    deleteQuery(db.collection("transactions").where("projectId", "==", projectId)),
  ]);
  await projectRef.delete();
}

export async function listTasks(projectId: string, projectName = ""): Promise<ProjectTask[]> {
  const db = getAdminDb();
  const projectRef = db.collection("projects").doc(projectId);
  const [nested, legacy] = await Promise.all([
    projectRef.collection("tasks").get(),
    db.collection("tasks").where("projectId", "==", projectId).get(),
  ]);
  const merged = new Map<string, ProjectTask>();
  legacy.docs.forEach((doc) => merged.set(doc.id, toTask(projectId, doc.id, doc.data(), projectName)));
  nested.docs.forEach((doc) => merged.set(doc.id, toTask(projectId, doc.id, doc.data(), projectName)));
  return Array.from(merged.values()).sort((a, b) => a.order - b.order);
}

export async function listTasksForUser(user: SessionUser, projects?: Project[]): Promise<ProjectTask[]> {
  const visibleProjects = projects ?? await listProjects(user);
  const groups = await Promise.all(visibleProjects.map((project) => listTasks(project.id, project.name)));
  const tasks = groups.flat();
  if (user.role === "ADMIN") return tasks;
  if (user.role === "PROJECT_MANAGER") {
    const managedIds = new Set(visibleProjects.filter((project) => !project.leadId || project.leadId === user.uid).map((project) => project.id));
    return tasks.filter((task) => managedIds.has(task.projectId) || task.assigneeId === user.uid || (!task.assigneeId && task.assignee.toLowerCase() === user.name.toLowerCase()));
  }
  return tasks.filter((task) => task.assigneeId === user.uid || (!task.assigneeId && task.assignee.toLowerCase() === user.name.toLowerCase()));
}

export async function addTask(projectId: string, data: Omit<ProjectTask, "id" | "projectId" | "projectName" | "completed" | "order" | "createdAt" | "updatedAt">) {
  const projectRef = getAdminDb().collection("projects").doc(projectId);
  const now = new Date().toISOString();
  await projectRef.collection("tasks").add({
    ...data,
    completed: data.status === "DONE",
    order: Date.now(),
    createdAt: now,
    updatedAt: now,
  });
  await projectRef.update({ updatedAt: now });
}

async function refreshProjectProgress(projectId: string) {
  const projectRef = getAdminDb().collection("projects").doc(projectId);
  const tasks = await listTasks(projectId);
  const completedCount = tasks.filter((task) => task.status === "DONE").length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  await projectRef.update({ progress, updatedAt: new Date().toISOString() });
}

async function findTaskRef(projectId: string, taskId: string) {
  const db = getAdminDb();
  const nestedRef = db.collection("projects").doc(projectId).collection("tasks").doc(taskId);
  if ((await nestedRef.get()).exists) return nestedRef;
  const legacyRef = db.collection("tasks").doc(taskId);
  const legacy = await legacyRef.get();
  if (legacy.exists && String(legacy.data()?.projectId ?? "") === projectId) return legacyRef;
  throw new Error("Tugas tidak ditemukan.");
}

export async function getTask(projectId: string, taskId: string): Promise<ProjectTask | null> {
  try {
    const ref = await findTaskRef(projectId, taskId);
    const snapshot = await ref.get();
    return snapshot.exists ? toTask(projectId, snapshot.id, snapshot.data() ?? {}) : null;
  } catch {
    return null;
  }
}

export async function setTaskStatus(projectId: string, taskId: string, status: TaskStatus) {
  const taskRef = await findTaskRef(projectId, taskId);
  const data = (await taskRef.get()).data() ?? {};
  await taskRef.update({
    status,
    completed: status === "DONE",
    ...(Object.prototype.hasOwnProperty.call(data, "isCompleted") ? { isCompleted: status === "DONE" } : {}),
    updatedAt: new Date().toISOString(),
  });
  await refreshProjectProgress(projectId);
}

export async function reorderTasks(projectId: string, taskIds: string[]) {
  const db = getAdminDb();
  const projectRef = db.collection("projects").doc(projectId);
  const [nested, legacy] = await Promise.all([
    projectRef.collection("tasks").get(),
    db.collection("tasks").where("projectId", "==", projectId).get(),
  ]);
  const refs = new Map<string, DocumentReference>();
  legacy.docs.forEach((doc) => refs.set(doc.id, doc.ref));
  nested.docs.forEach((doc) => refs.set(doc.id, doc.ref));
  const batch = db.batch();
  const now = new Date().toISOString();
  taskIds.forEach((taskId, index) => {
    const ref = refs.get(taskId);
    if (ref) batch.update(ref, { order: index, updatedAt: now });
  });
  batch.update(projectRef, { updatedAt: now });
  await batch.commit();
}

export async function deleteTask(projectId: string, taskId: string) {
  const taskRef = await findTaskRef(projectId, taskId);
  await taskRef.delete();
  await refreshProjectProgress(projectId);
}

export async function listComments(projectId: string): Promise<ProjectComment[]> {
  const db = getAdminDb();
  const projectRef = db.collection("projects").doc(projectId);
  const [nested, legacy] = await Promise.all([
    projectRef.collection("comments").get(),
    db.collection("comments").where("projectId", "==", projectId).get(),
  ]);
  const merged = new Map<string, ProjectComment>();
  legacy.docs.forEach((doc) => merged.set(doc.id, toComment(projectId, doc.id, doc.data())));
  nested.docs.forEach((doc) => merged.set(doc.id, toComment(projectId, doc.id, doc.data())));
  return Array.from(merged.values()).sort((a, b) => (parseDateValue(a.createdAt)?.getTime() ?? 0) - (parseDateValue(b.createdAt)?.getTime() ?? 0));
}

export async function addComment(projectId: string, input: Omit<ProjectComment, "id" | "projectId" | "createdAt">) {
  const projectRef = getAdminDb().collection("projects").doc(projectId);
  const now = new Date().toISOString();
  await projectRef.collection("comments").add({ ...input, createdAt: now });
  await projectRef.update({ updatedAt: now });
}

export async function deleteComment(projectId: string, commentId: string, userId: string, isAdmin: boolean) {
  const db = getAdminDb();
  const nestedRef = db.collection("projects").doc(projectId).collection("comments").doc(commentId);
  const nested = await nestedRef.get();
  const ref = nested.exists ? nestedRef : db.collection("comments").doc(commentId);
  const snapshot = nested.exists ? nested : await ref.get();
  if (!snapshot.exists || String(snapshot.data()?.projectId ?? projectId) !== projectId) return;
  const ownerId = String(snapshot.data()?.authorId ?? snapshot.data()?.userId ?? "");
  if (!isAdmin && ownerId !== userId) throw new Error("Anda hanya dapat menghapus komentar yang Anda buat.");
  await ref.delete();
}

export async function listAttachments(projectId: string): Promise<ProjectAttachment[]> {
  const db = getAdminDb();
  const projectRef = db.collection("projects").doc(projectId);
  const [nested, legacy] = await Promise.all([
    projectRef.collection("attachments").get(),
    db.collection("attachments").where("projectId", "==", projectId).get(),
  ]);
  const merged = new Map<string, ProjectAttachment>();
  legacy.docs.forEach((doc) => merged.set(doc.id, toAttachment(projectId, doc.id, doc.data())));
  nested.docs.forEach((doc) => merged.set(doc.id, toAttachment(projectId, doc.id, doc.data())));
  return Array.from(merged.values()).sort((a, b) => (parseDateValue(b.createdAt)?.getTime() ?? 0) - (parseDateValue(a.createdAt)?.getTime() ?? 0));
}

export async function addAttachment(projectId: string, input: Omit<ProjectAttachment, "id" | "projectId" | "createdAt">) {
  const projectRef = getAdminDb().collection("projects").doc(projectId);
  const now = new Date().toISOString();
  await projectRef.collection("attachments").add({ ...input, createdAt: now });
  await projectRef.update({ updatedAt: now });
}

export async function deleteAttachment(projectId: string, attachmentId: string, userId: string, isAdmin: boolean) {
  const db = getAdminDb();
  const nestedRef = db.collection("projects").doc(projectId).collection("attachments").doc(attachmentId);
  const nested = await nestedRef.get();
  const ref = nested.exists ? nestedRef : db.collection("attachments").doc(attachmentId);
  const snapshot = nested.exists ? nested : await ref.get();
  if (!snapshot.exists || String(snapshot.data()?.projectId ?? projectId) !== projectId) return;
  const ownerId = String(snapshot.data()?.createdBy ?? "");
  if (!isAdmin && ownerId !== userId) throw new Error("Anda hanya dapat menghapus lampiran yang Anda tambahkan.");
  await ref.delete();
}

export async function listActivities(projectId: string, limit = 30): Promise<ProjectActivity[]> {
  const db = getAdminDb();
  const projectRef = db.collection("projects").doc(projectId);
  const [nested, legacy] = await Promise.all([
    projectRef.collection("activities").get(),
    db.collection("activityLogs").where("projectId", "==", projectId).get(),
  ]);
  const merged = new Map<string, ProjectActivity>();
  legacy.docs.forEach((doc) => merged.set(doc.id, toActivity(projectId, doc.id, doc.data())));
  nested.docs.forEach((doc) => merged.set(doc.id, toActivity(projectId, doc.id, doc.data())));
  return Array.from(merged.values())
    .sort((a, b) => (parseDateValue(b.createdAt)?.getTime() ?? 0) - (parseDateValue(a.createdAt)?.getTime() ?? 0))
    .slice(0, limit);
}

export async function addActivity(projectId: string, input: Omit<ProjectActivity, "id" | "projectId" | "createdAt">) {
  await getAdminDb().collection("projects").doc(projectId).collection("activities").add({
    ...input,
    createdAt: new Date().toISOString(),
  });
}
