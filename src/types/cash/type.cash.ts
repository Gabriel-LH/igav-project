import { z } from "zod";

export const cashSessionSchema = z.object({
  id: z.string(),

  branchId: z.string(),
  openedById: z.string(),
  closedById: z.string().optional(),

  openedAt: z.date(),
  closedAt: z.date().optional(),

  sessionNumber: z.string(),

  status: z.enum(["open", "closed"]),

  openingAmount: z.number().default(0),

  closingExpectedAmount: z.number().optional(),
  closingCountedAmount: z.number().optional(),
  closingDifference: z.number().optional(),

  notes: z.string().optional(),
});

export type CashSession = z.infer<typeof cashSessionSchema>;
