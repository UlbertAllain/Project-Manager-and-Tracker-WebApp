import { z } from "zod";
export const transactionSchema = z.object({
  projectId: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive().max(1_000_000_000_000),
  description: z.string().trim().min(2).max(250),
  date: z.string().date(),
});
