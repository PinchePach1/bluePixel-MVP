import { z } from "zod";

export const RequestCreateSchema = z.object({
    title: z.string().min(3).max(100),
    description: z.string().min(5).max(500),
});

export const RequestUpdateSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(5).max(500).optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
});

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});