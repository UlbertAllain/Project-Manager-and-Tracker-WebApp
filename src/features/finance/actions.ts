"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { transactionSchema } from "@/features/finance/schema";
import { addTransaction, deleteTransaction } from "@/lib/repositories/transactions";

export async function addTransactionAction(formData: FormData) {
  const user = await requireAdmin();
  const data = transactionSchema.parse(Object.fromEntries(formData));
  await addTransaction({ ...data, createdBy: user.uid });
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${data.projectId}`);
}

export async function deleteTransactionAction(formData: FormData) {
  await requireAdmin();
  await deleteTransaction(String(formData.get("transactionId") ?? ""));
  revalidatePath("/finance");
  revalidatePath("/dashboard");
}
