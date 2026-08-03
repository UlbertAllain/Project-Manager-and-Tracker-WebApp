export type TransactionType = "INCOME" | "EXPENSE";
export interface Transaction {
  id: string;
  projectId: string;
  projectName: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  createdBy: string;
  createdAt: string;
}
