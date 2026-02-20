import z from "zod";

export const branchSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  status: z.enum(["active", "inactive"]), // Cambiado a enum para consistencia
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),

  metadata: z.record(z.string(), z.any()).optional(),
});

export type Branch = z.infer<typeof branchSchema>;
