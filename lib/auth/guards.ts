import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import type { Project } from "@/features/projects/types";

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Akses hanya untuk administrator.");
  return user;
}

export async function requireProjectManager(): Promise<SessionUser> {
  const user = await requireUser();
  if (!['ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
    throw new Error("Akses hanya untuk admin atau project manager.");
  }
  return user;
}

export function canAccessProject(user: SessionUser, project: Project) {
  if (user.role === "ADMIN") return true;
  const explicit = Boolean(project.leadId || project.teamMemberIds.length);
  if (!explicit) return true;
  return project.leadId === user.uid || project.teamMemberIds.includes(user.uid) || project.createdBy === user.uid;
}

export function canManageProject(user: SessionUser, project: Project) {
  if (user.role === "ADMIN") return true;
  if (user.role !== "PROJECT_MANAGER") return false;
  if (!project.leadId) return true;
  return project.leadId === user.uid || project.createdBy === user.uid;
}
