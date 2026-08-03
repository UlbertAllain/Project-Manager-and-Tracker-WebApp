import type { DocumentData } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Transaction } from "@/features/finance/types";
import { parseDateValue, toDateInputValue, toIsoDateTime } from "@/lib/format";

function toTransaction(id: string, data: DocumentData): Transaction {
  return {
    id,
    projectId: String(data.projectId ?? ""),
    projectName: String(data.projectName ?? ""),
    type: data.type === "EXPENSE" ? "EXPENSE" : "INCOME",
    amount: Number(data.amount ?? 0),
    description: String(data.description ?? ""),
    date: toDateInputValue(data.date),
    createdBy: String(data.createdBy ?? ""),
    createdAt: toIsoDateTime(data.createdAt),
  };
}

export async function listTransactions(): Promise<Transaction[]> {
  const db = getAdminDb();
  const [snapshot, projectsSnapshot] = await Promise.all([
    db.collection("transactions").get(),
    db.collection("projects").get(),
  ]);
  const projectNames = new Map(
    projectsSnapshot.docs.map((doc) => [doc.id, String(doc.data().name ?? doc.data().projectName ?? "")]),
  );
  return snapshot.docs
    .map((doc) => {
      const transaction = toTransaction(doc.id, doc.data());
      return transaction.projectName
        ? transaction
        : { ...transaction, projectName: projectNames.get(transaction.projectId) ?? "Project tidak ditemukan" };
    })
    .sort((a, b) => (parseDateValue(b.date)?.getTime() ?? 0) - (parseDateValue(a.date)?.getTime() ?? 0));
}

export async function addTransaction(data: Omit<Transaction, "id" | "projectName" | "createdAt">) {
  const db = getAdminDb();
  const projectRef = db.collection("projects").doc(data.projectId);
  const txRef = db.collection("transactions").doc();
  await db.runTransaction(async (transaction) => {
    const project = await transaction.get(projectRef);
    if (!project.exists) throw new Error("Project tidak ditemukan.");
    const projectData = project.data()!;
    const field = data.type === "INCOME" ? "paidAmount" : "totalExpense";
    const currentValue = Number(projectData[field] ?? 0);
    transaction.set(txRef, { ...data, projectName: projectData.name ?? projectData.projectName ?? "", createdAt: new Date().toISOString() });
    transaction.update(projectRef, { [field]: currentValue + data.amount, updatedAt: new Date().toISOString() });
  });
}

export async function deleteTransaction(transactionId: string) {
  const db = getAdminDb();
  const txRef = db.collection("transactions").doc(transactionId);
  await db.runTransaction(async (transaction) => {
    const txDoc = await transaction.get(txRef);
    if (!txDoc.exists) return;
    const data = txDoc.data()!;
    const projectRef = db.collection("projects").doc(String(data.projectId));
    const projectDoc = await transaction.get(projectRef);
    if (projectDoc.exists) {
      const field = data.type === "INCOME" ? "paidAmount" : "totalExpense";
      const currentValue = Number(projectDoc.data()![field] ?? 0);
      transaction.update(projectRef, { [field]: Math.max(0, currentValue - Number(data.amount ?? 0)), updatedAt: new Date().toISOString() });
    }
    transaction.delete(txRef);
  });
}
