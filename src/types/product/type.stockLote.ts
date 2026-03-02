import { z } from "zod";

export const stockLotSchema = z.object({
  id: z.string(),

  tenantId: z.string(),
  productId: z.string(),
  variantId: z.string(),

  branchId: z.string(),

  quantity: z.number().min(0),

  isForRent: z.boolean(),
  isForSale: z.boolean(),

  status: z
    .enum(["disponible", "bajo_pedido", "discontinuado"])
    .default("disponible"),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type StockLot = z.infer<typeof stockLotSchema>;
