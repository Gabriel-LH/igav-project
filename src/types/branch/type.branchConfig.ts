import { z } from "zod";

export const branchConfigSchema = z.object({
  id: z.string(),
  branchId: z.string(),

  openHours: z.object({
    open: z.string(),
    close: z.string(),
  }),

  // Deprecated: Moving to TenantPolicy (plural or singular)
  // We keep them optional for backward compatibility with existing DB records
  daysInLaundry: z.number().optional(),
  daysInMaintenance: z.number().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BranchConfig = z.infer<typeof branchConfigSchema>;
