import { z } from "zod";

export const transferSchema = z.object({
  id: z.string(),
  tenantId: z.string(),

  code: z.string(), // TR-0001

  originBranchId: z.string(),
  destinationBranchId: z.string(),

  status: z.enum([
    "draft",
    "sent",
    "in_transit",
    "received",
    "cancelled"
  ]),

  sentAt: z.date().optional(),
  receivedAt: z.date().optional(),

  createdBy: z.string(),
  receivedBy: z.string().optional(),

  notes: z.string().optional(),

  createdAt: z.date(),
});

export type Transfer = z.infer<typeof transferSchema>;
