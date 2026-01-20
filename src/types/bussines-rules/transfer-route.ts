import { z } from "zod";

export const transferRouteSchema = z.object({
  originBranchId: z.string(),
  destinationBranchId: z.string(),
  estimatedTime: z.number(),
});

export type TransferRoute = z.infer<typeof transferRouteSchema>;