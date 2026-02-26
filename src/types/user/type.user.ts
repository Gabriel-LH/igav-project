import z from "zod";

export const userSchema = z.object({
  id: z.string(),
  userName: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  createdAt: z.date(),
  createdBy: z.string().optional(),
  updatedAt: z.date(), // Cuándo fue la última vez que se editó (opcional pero recomendado)
  updatedBy: z.string().optional(),
  role: z.string().optional(),
  branchId: z.string().optional(),
  deletedAt: z.date().optional(),
  deletedBy: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;
