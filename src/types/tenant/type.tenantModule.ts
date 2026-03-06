import z from "zod";

export const tenantModuleSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  moduleId: z.string(),
  status: z.enum(["active", "canceled"]),
  startedAt: z.date(),
});

export type TenantModule = z.infer<typeof tenantModuleSchema>;
