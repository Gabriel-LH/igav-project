import { z } from "zod";
export const RoleSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(2).max(50),
  description: z.string().optional(),
  isSystem: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Role = z.infer<typeof RoleSchema>;