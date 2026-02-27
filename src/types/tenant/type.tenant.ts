import { z } from "zod";
import { businessRulesSchema } from "../bussines-rules/bussines-rules";

export const TenantSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  status: z.enum(["active", "suspended"]),
  bussinesRuls: businessRulesSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Tenant = z.infer<typeof TenantSchema>;