import z from "zod";

export const saleItemSchema = z.object({
  id: z.string(),
  saleId: z.string(),
  productId: z.string(),
  stockId: z.string(), // La prenda específica que se llevó
  priceAtMoment: z.number(),
  quantity: z.number(),

  // Campos "Pro" para devoluciones:
  isReturned: z.boolean().default(false),
  returnedAt: z.date().optional(),
  returnCondition: z.enum(["perfecto", "dañado", "manchado"]).optional(),
  restockingFee: z.number().default(0), // Cobro extra por devolverlo dañado
});

export type SaleItem = z.infer<typeof saleItemSchema>;
