import { z } from "zod";

export const branchConfigSchema = z.object({
  branchId: z.string(),

  openHours: z.object({
    open: z.string(),
    close: z.string(),
  }),

  daysInLaundry: z.number(),
  daysInMaintenance: z.number(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BranchConfig = z.infer<typeof branchConfigSchema>;
