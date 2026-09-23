import type { DocumentData } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { toIsoDateTime } from "@/lib/format";
import type { UserProfile, UserRole } from "@/features/users/types";

function normalizeRole(value: unknown): UserRole {
  if (value === "ADMIN" || value === "PROJECT_MANAGER" || value === "MEMBER") return value;
  if (value === "PROJECT_LEAD") return "PROJECT_MANAGER";
  return "MEMBER";
}

function toUser(uid: string, data: DocumentData): UserProfile {
  return {
    uid,
    email: String(data.email ?? ""),
    name: String(data.name ?? data.displayName ?? data.email ?? "Anggota tim"),
    role: normalizeRole(data.role),
    jobTitle: String(data.jobTitle ?? ""),
    department: String(data.department ?? ""),
    isActive: data.isActive !== false,
    createdAt: toIsoDateTime(data.createdAt),
    updatedAt: toIsoDateTime(data.updatedAt),
  };
}

export async function listUsers(): Promise<UserProfile[]> {
  const snapshot = await getAdminDb().collection("users").get();
  return snapshot.docs
    .filter((doc) => {
      const data = doc.data();
      return !data.migratedToUid && data.authStatus !== "MISSING";
    })
    .map((doc) => toUser(doc.id, doc.data()))
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getAdminDb().collection("users").doc(uid).get();
  return snapshot.exists ? toUser(snapshot.id, snapshot.data() ?? {}) : null;
}

export async function createInternalUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  jobTitle: string;
  department: string;
}) {
  const auth = getAdminAuth();
  const db = getAdminDb();
  const account = await auth.createUser({
    email: input.email,
    password: input.password,
    displayName: input.name,
    emailVerified: true,
    disabled: false,
  });
  await auth.setCustomUserClaims(account.uid, { role: input.role });
  const now = new Date().toISOString();
  await db.collection("users").doc(account.uid).set({
    email: input.email,
    name: input.name,
    role: input.role,
    jobTitle: input.jobTitle,
    department: input.department,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  return account.uid;
}

export async function updateInternalUser(input: {
  uid: string;
  name: string;
  role: UserRole;
  jobTitle: string;
  department: string;
  isActive: boolean;
}) {
  const auth = getAdminAuth();
  const db = getAdminDb();
  await auth.updateUser(input.uid, {
    displayName: input.name,
    disabled: !input.isActive,
  });
  await auth.setCustomUserClaims(input.uid, { role: input.role });
  await db.collection("users").doc(input.uid).set({
    name: input.name,
    role: input.role,
    jobTitle: input.jobTitle,
    department: input.department,
    isActive: input.isActive,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}
