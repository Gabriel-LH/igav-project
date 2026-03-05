import { z } from "zod";

export const clientSchema = z.object({
  id: z.number(),
  name: z.string(),
  operationsRent: z.number(),
  operationsBuy: z.number(),
  totalRent: z.string(),
  totalBuy: z.string(),
  lastOperation: z.string(),
  status: z.string(),
  type: z.string(),
});

export type Client = z.infer<typeof clientSchema>;

