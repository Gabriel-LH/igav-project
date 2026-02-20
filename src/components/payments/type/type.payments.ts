import z from "zod";

export const paymentTableSchema = z.object({
  id: z.string(),
  clientName: z.string(),
  operationType: z.string(),
  receivedBy: z.string(),
  amount: z.number().positive(),
  date: z.date(),
  paid: z.number().positive(),
  balance: z.number().positive(),
  method: z.string(),
  status: z.string(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});
