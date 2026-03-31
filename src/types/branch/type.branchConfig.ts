import { z } from "zod";

export const branchConfigSchema = z.object({
  id: z.string(),
  branchId: z.string(),

  // Expanded schedule configuration
  openHours: z.object({
    open: z.string().default("09:00"),
    close: z.string().default("18:00"),
    schedule: z.array(z.object({
      day: z.string(),
      enabled: z.boolean(),
      open: z.string(),
      close: z.string(),
    })).optional(),
  }),

  // Deprecated: Moving to TenantPolicy (plural or singular)
  // We keep them optional for backward compatibility with existing DB records
  daysInLaundry: z.number().optional(),
  daysInMaintenance: z.number().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BranchConfig = z.infer<typeof branchConfigSchema>;
