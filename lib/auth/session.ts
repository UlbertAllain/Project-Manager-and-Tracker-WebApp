import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import type { UserRole } from "@/features/users/types";

export const SESSION_COOKIE_NAME = "nexty_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export interface SessionUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}

function normalizeRole(value: unknown): UserRole {
  if (value === "ADMIN" || value === "PROJECT_MANAGER" || value === "MEMBER") return value;
  if (value === "PROJECT_LEAD") return "PROJECT_MANAGER";
  return "MEMBER";
}

export async function createSession(idToken: string): Promise<string> {
  const decoded = await getAdminAuth().verifyIdToken(idToken, true);
  const signedInSecondsAgo = Math.floor(Date.now() / 1000) - decoded.auth_time;
  if (signedInSecondsAgo > 5 * 60) {
    throw new Error("Login ulang diperlukan sebelum membuat sesi.");
  }

  return getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      name: typeof decoded.name === "string" ? decoded.name : decoded.email ?? "User",
      role: normalizeRole(decoded.role),
    };
  } catch {
    return null;
  }
}
