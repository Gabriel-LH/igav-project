import z from "zod";

export const saleItemSchema = z.object({
  id: z.string(),
  saleId: z.string(),
  productId: z.string(),
  stockId: z.string(), // La prenda específica que se llevó
  priceAtMoment: z.number(),
  quantity: z.number(),
});