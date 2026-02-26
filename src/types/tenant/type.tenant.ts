import { z } from "zod";

export const TenantSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  status: z.enum(["active", "suspended"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Tenant = z.infer<typeof TenantSchema>;