"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { createUserSchema, updateUserSchema } from "@/features/users/schema";
import { createInternalUser, updateInternalUser } from "@/lib/repositories/users";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();
  const payload = createUserSchema.parse({
    name: text(formData, "name"),
    email: text(formData, "email"),
    password: text(formData, "password"),
    role: text(formData, "role"),
    jobTitle: text(formData, "jobTitle"),
    department: text(formData, "department"),
  });
  await createInternalUser(payload);
  revalidatePath("/team");
}

export async function updateUserAction(formData: FormData) {
  const currentUser = await requireAdmin();
  const payload = updateUserSchema.parse({
    uid: text(formData, "uid"),
    name: text(formData, "name"),
    role: text(formData, "role"),
    jobTitle: text(formData, "jobTitle"),
    department: text(formData, "department"),
    isActive: text(formData, "isActive") === "true",
  });
  if (payload.uid === currentUser.uid && !payload.isActive) {
    throw new Error("Akun yang sedang digunakan tidak dapat dinonaktifkan.");
  }
  await updateInternalUser(payload);
  revalidatePath("/team");
}
