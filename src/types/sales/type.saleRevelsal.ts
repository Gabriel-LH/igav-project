import z from "zod";

export const saleReversalItemSchema = z.object({
  saleItemId: z.string(),
  condition: z.enum(["perfecto", "dañado", "manchado"]).optional(),
  restockingFee: z.number().default(0),
  refundedAmount: z.number(),
});

export const saleReversalSchema = z.object({
  id: z.string(),
  saleId: z.string(),

  type: z.enum(["annulment", "return"]),
  reason: z.string(),

  items: z.array(saleReversalItemSchema).optional(),

  totalRefunded: z.number(),

  createdAt: z.date(),
  createdBy: z.string().optional(),
});

export type SaleReversal = z.infer<typeof saleReversalSchema>;
