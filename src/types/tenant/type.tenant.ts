import { z } from "zod";
import { businessRulesSchema } from "../bussines-rules/bussines-rules";

export const TenantSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  slug: z.string(),
  ownerId: z.string(),
  status: z.enum(["active", "suspended"]),
  bussinesRuls: businessRulesSchema,
  currentSubscriptionId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Tenant = z.infer<typeof TenantSchema>;
