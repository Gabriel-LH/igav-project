import z from "zod";

export const paymentTableSchema = z.object({
  id: z.string(),
  clientName: z.string(),
  operationType: z.string(),
  receivedBy: z.string(),
  amount: z.number(),
  direction: z.enum(["in", "out"]),
  category: z.enum(["payment", "refund", "correction"]),
  status: z.enum(["pending", "posted"]),
  date: z.date(),
  method: z.string(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});
