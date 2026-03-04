import { z } from "zod";

export const transferRouteSchema = z.object({
  id: z.string(),
  tenantId: z.string(),

  originBranchId: z.string(),
  destinationBranchId: z.string(),

  estimatedTimeHours: z.number(),

  status: z.enum(["active", "inactive"]).default("active"),

  createdAt: z.date(),
});

export type TransferRoute = z.infer<typeof transferRouteSchema>;
