import { z } from "zod";
import { USER_ROLES } from "@/features/users/types";

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  role: z.enum(USER_ROLES),
  jobTitle: z.string().trim().max(100).default(""),
  department: z.string().trim().max(100).default(""),
});

export const updateUserSchema = z.object({
  uid: z.string().min(1),
  name: z.string().trim().min(2).max(100),
  role: z.enum(USER_ROLES),
  jobTitle: z.string().trim().max(100).default(""),
  department: z.string().trim().max(100).default(""),
  isActive: z.coerce.boolean(),
});
