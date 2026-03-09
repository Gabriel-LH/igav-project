import { z } from "zod";
import { tenantConfigSchema } from "./type.tenantConfig";

export const TenantSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  slug: z.string(),
  ownerId: z.string(),
  status: z.enum(["active", "suspended", "trial"]),
  tenantConfig: tenantConfigSchema,
  currentSubscriptionId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.string()
});

export type Tenant = z.infer<typeof TenantSchema>;
